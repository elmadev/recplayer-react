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
  componentDidUpdate(prevProps) {
    if (this.props.levUrl !== prevProps.levUrl) {
      this.updateLevRec(this.props.recUrl, this.props.levUrl);
      return;
    }
    if (this.props.recUrl !== prevProps.recUrl && this.props.recUrl) {
      if (typeof this.props.merge === 'boolean') {
        if (this.props.merge) {
          this.updateLevRec(this.props.recUrl);
          return;
        }
        this.updateLevRec(this.props.recUrl, this.props.levUrl);
        return;
      }
      this.updateLevRec(this.props.recUrl);
    }
  }
  componentDidMount() {
    this._isMounted = true;
    this._wakeLock = null;
    window.addEventListener("resize", this.autoResize);
    document.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("visibilitychange", this.enableWakeLock);

    this.initPlayer({
      levUrl: this.props.levUrl,
      recUrl: this.props.recUrl
    });
  }
  updateLevRec = (recUrl, levUrl = '') => {
    if (levUrl) {
      this.removeAnimationLoop();
      this.playerContainer.querySelector("canvas").remove();
      this.initPlayer({
        levUrl,
        recUrl,
      });
      return;
    }
    this.cnt.loadReplay(recUrl);
  };
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
    document.removeEventListener("visibilitychange", this.enableWakeLock);
    this.removeAnimationLoop();
    this.disableWakeLock();
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
      if (urls.recUrl) {
        const recs = urls.recUrl.split(';');
        recs.forEach(r => {
          cnt.loadReplay(r);
        });
      }
      cnt.player().setScale(this.props.zoom || 0.8);
      if (this.props.levelOptions) {
        const { grass, pictures, customBackgroundSky } = this.props.levelOptions;
        cnt.player().setLevOpts({
          grass: typeof grass === 'boolean' ? grass : true,
          pictures: typeof pictures === 'boolean' ? pictures : true,
          customBackgroundSky: typeof customBackgroundSky === 'boolean' ? customBackgroundSky : true,
        });
      }
      if (this.props.onInitialize) {
        this.props.onInitialize(cnt);
      }
      this.enableWakeLock();
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
      if(this.cnt.player().playing()) {
        this.enableWakeLock();
      } else {
        this.disableWakeLock();
      }
      this.setState({
        playing: this.cnt.player().playing()
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
    setTimeout(() => {
      this._mouseDrag = false;
      this._mouseDown = false;
    }, 100);
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
    if(this._mouseDown)
      this._mouseDrag = true;

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
  playerContainerOnTouchStart = (e) => {
    this.playerContainer.focus();
    
    if (e.touches.length === 2) {
      this._pinch = true;
    }
  };
  playerContainerOnTouchEnd = (e) => {
    this._pinch = false;
    this._preDist = null;
  };
  playerContainerOnTouchMove = (e) => {
    if (this._pinch) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );

      if (this._preDist) {
        const pl = this.cnt.player();
        const scale = pl.scale();

        if (this._preDist < dist) {
          pl.setScale(scale * 1.2);
        } else {
          pl.setScale(scale / 1.2);
        }
      }

      this._preDist = dist;
    }
  };
  onClick = e => {
    if (e.target.localName === 'canvas' && !this._mouseDrag) {
      this.playPause();
    }
  }
  onMouseDown = e => {
    if (e.target.localName === 'canvas') {
      this._mouseDown = true;
    }
  }
  onDoubleClick = e => {
    if (e.target.localName === 'canvas') {
      this.fullscreen();
    }
  }
  enableWakeLock = async () => {
    if(!this.props.wakeLock) {
      return;
    }

    if(!this.cnt || !this.cnt.player().playing()) {
      return;
    }

    if(document.visibilityState !== "visible") {
      return;
    }

    if(this._wakeLock) {
      return;
    }

    try {
      this._wakeLock = await navigator.wakeLock.request('screen');
      this._wakeLock.addEventListener('release', () => {
        this._wakeLock = null;
      });
    } catch (err) {
      console.error(err);
    }
  }
  disableWakeLock = async () => {
    if(this._wakeLock) {
      await this._wakeLock.release();
      this._wakeLock = null;
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
        onMouseDown={this.onMouseDown}
        onDoubleClick={this.onDoubleClick}
      >
        <div
          className="RecPlayer-player-container"
          onTouchStart={this.playerContainerOnTouchStart}
          onTouchEnd={this.playerContainerOnTouchEnd}
          onTouchMove={this.playerContainerOnTouchMove}
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
