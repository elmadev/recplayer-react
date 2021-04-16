import React, { Component } from "react";
import controller from "recplayer";
import "./RecPlayer.css";
import PlayIcon from "./img/play.svg";
import PauseIcon from "./img/pause.svg";
import FullscreenIcon from "./img/fullscreen.svg";

class RecPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: props.autoPlay || false,
      fullscreen: false,
      maxFrames: 0,
      progressBarDrag: false,
      currentFrame: 0
    };
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      playing: nextProps.autoPlay || false
    });
    if (this.props.levUrl !== nextProps.levUrl) {
      this.removeAnimationLoop();
      this.playerContainer.querySelector("canvas").remove();
      this.initPlayer({
        levUrl: nextProps.levUrl,
        recUrl: nextProps.recUrl
      });
    } else if (this.props.recUrl !== nextProps.recUrl) {
      nextProps.recUrl && this.cnt.loadReplay(nextProps.recUrl);
    }
  }
  componentDidMount() {
    this._isMounted = true;
    window.addEventListener("resize", this.autoResize);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mousemove", this.onMouseMove);
    this.initPlayer({
      levUrl: this.props.levUrl,
      recUrl: this.props.recUrl
    });
  }
  removeAnimationLoop = () => {
    if (this.cnt) {
      this.cnt.removeAnimationLoop();
    }
  };
  componentWillUnmount() {
    this._isMounted = false;
    window.removeEventListener("resize", this.autoResize);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.removeAnimationLoop();
  }
  frameCallback = (currentFrame, maxFrames) => {
    this._isMounted &&
      this.setState({
        maxFrames: maxFrames,
        currentFrame: currentFrame > maxFrames ? maxFrames : currentFrame,
        progress: (currentFrame / maxFrames) * 100
      });
  };
  initPlayer = urls => {
    controller(
      urls.levUrl,
      this.props.imageUrl || "http://www.recsource.tv/images",
      this.playerContainer,
      document,
      this.frameCallback,
      this.props.autoPlay || false
    )(cnt => {
      this.cnt = cnt;
      this.autoResize();
      urls.recUrl && cnt.loadReplay(urls.recUrl);
      cnt.player().setScale(this.props.zoom || 0.8);
      if (props.onInitialize) {
        props.onInitialize(cnt);
      }
    });
  };
  autoResize = () => {
    if (this.cnt && this.playerContainer) {
      let w =
        ((this.props.width == "auto" || this.state.fullscreen) &&
          this.playerContainer.offsetWidth) ||
        this.props.width;
      let h =
        ((this.props.height == "auto" || this.state.fullscreen) &&
          this.playerContainer.offsetHeight) ||
        this.props.height;
      this.cnt.resize(w, h);
    }
  };
  playPause = () => {
    if (this.cnt) {
      this.cnt.player().playPause();
      this.setState((prevState, props) => {
        return {
          playing: !prevState.playing
        };
      });
    }
  };
  fullscreen = () => {
    this.setState((prevState, props) => {
      return {
        fullscreen: !prevState.fullscreen
      };
    }, this.autoResize);
  };
  goToFrame = frame => {
    if (this.cnt) {
      this.cnt.setFrame(frame);
    }
  };
  progressBarOnMouseDown = e => {
    if (this.cnt) {
      this.setState({
        progressBarDrag: true
      });
      this._wasPlaying = this.cnt.player().playing();
      if (this._wasPlaying) {
        this.playPause();
      }
      this.goToFrame(
        this.state.maxFrames *
          (e.nativeEvent.offsetX / e.currentTarget.offsetWidth)
      );
    }
  };
  progressBarOnTouchStart = () => {
    this._wasPlaying = this.cnt.player().playing();
    if (this._wasPlaying) {
      this.playPause();
    }
  };
  progressBarOnTouchMove = e => {
    if (this._progressBar) {
      let pos =
        (e.touches[0].clientX -
          this._progressBar.getBoundingClientRect().left) /
        this._progressBar.offsetWidth;
      if (pos < 0) pos = 0;
      else if (pos > 1) pos = 1;
      this.goToFrame(this.state.maxFrames * pos);
    }
  };
  onMouseUp = () => {
    if (this.state.progressBarDrag && this._wasPlaying) {
      this.playPause();
    }
    this.setState({
      progressBarDrag: false
    });
  };
  progressBarOnTouchEnd = () => {
    if (this._wasPlaying) {
      this.playPause();
    }
    this.setState({
      progressBarDrag: false
    });
  };
  onMouseMove = e => {
    if (this.state.progressBarDrag && this._progressBar) {
      let pos =
        (e.pageX - this._progressBar.getBoundingClientRect().left) /
        this._progressBar.offsetWidth;
      if (pos < 0) pos = 0;
      else if (pos > 1) pos = 1;
      this.goToFrame(this.state.maxFrames * pos);
    }
  };
  frameToTimestamp = frame => {
    let time = Math.floor((frame * 100) / 30);
    let csec = (time % 100).toString().padStart(2, 0);
    time = Math.floor(time / 100);
    let sec = (time % 60).toString().padStart(2, 0);
    time = Math.floor(time / 60);
    return time > 0 ? time + ":" + sec + ":" + csec : sec + ":" + csec;
  };
  playerContainerOnTap = () => {
    this.playerContainer.focus();
  };
  onClick = e => {
    if (e.target.localName === 'canvas') {
      this.playPause();
    }
  }
  onDoubleClick = e => {
    if (e.target.localName === 'canvas') {
      this.fullscreen();
    }
  }
  render() {
    let className = this.state.fullscreen
      ? "RecPlayer RecPlayer-fullscreen"
      : "RecPlayer";

    if (this.state.progressBarDrag) className += " RecPlayer-progressBar-drag";

    return (
      <div
        style={{
          height:
            this.props.height === "auto" ? "100%" : this.props.height + "px",
          width: this.props.width === "auto" ? "100%" : this.props.width + "px"
        }}
        className={className}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
      >
        <div
          className="RecPlayer-player-container"
          onTouchStart={this.playerContainerOnTap}
          tabIndex="0"
          ref={element => {
            this.playerContainer = element;
          }}
        >
          {this.props.controls && (
            <div className="RecPlayer-controls">
              <div
                className="RecPlayer-controls-progress-bar"
                ref={el => (this._progressBar = el)}
                onMouseDown={e => this.progressBarOnMouseDown(e)}
                onTouchMove={e => this.progressBarOnTouchMove(e)}
                onTouchStart={this.progressBarOnTouchStart}
                onTouchEnd={this.progressBarOnTouchEnd}
              >
                <div className="RecPlayer-controls-progress-bar-background">
                  <div
                    style={{ width: this.state.progress + "%" }}
                    className="RecPlayer-controls-progress-bar-progress"
                  />
                </div>
              </div>
              <div className="RecPlayer-controls-bottom-row">
                <div
                  className="RecPlayer-controls-button"
                  style={this.state.playing ? { display: "none" } : {}}
                  onClick={this.playPause}
                >
                  <img src={PlayIcon} />
                </div>
                <div
                  className="RecPlayer-controls-button"
                  style={!this.state.playing ? { display: "none" } : {}}
                  onClick={this.playPause}
                >
                  <img src={PauseIcon} />
                </div>
                <div className="RecPlayer-controls-timestamp">
                  {this.frameToTimestamp(this.state.currentFrame)}
                </div>
                <div
                  className="RecPlayer-controls-button RecPlayer-controls-button-fullscreen"
                  onClick={this.fullscreen}
                >
                  <img src={FullscreenIcon} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RecPlayer;
