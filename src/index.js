import React, { Component } from "react";
import controller from "recplayer";
import "./RecPlayer.css";
import PlayIcon from "./img/play.svg";
import PauseIcon from "./img/pause.svg";
import FullscreenIcon from "./img/fullscreen.svg";
import ZoomOutIcon from "./img/zoomout.svg";
import ZoomInIcon from "./img/zoomin.svg";
import ReverseIcon from "./img/reverse.svg";
import ForwardIcon from "./img/forward.svg";
import BackwardIcon from "./img/backward.svg";

class RecPlayer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: props.autoPlay || false,
      fullscreen: false,
      maxFrames: 0,
      progressBarDrag: false,
      currentFrame: 0,
    };
    this.playerContainerRef = React.createRef();

    this.lgrFrom = this.props.lgrFrom || 'level'
    this.lgrUrl = this.props.lgrUrl
    if(!this.lgrUrl) {
      if(this.lgrFrom === 'level') {
        this.lgrUrl = 'https://api.elma.online/api/lgr/get/'
      }
    }
  }
  componentDidUpdate(prevProps) {
    if (!isNaN(this.props.frame) && this.props.frame !== prevProps.frame) {
      this.goToFrame(this.props.frame);
    }
    if (this.props.levUrl !== prevProps.levUrl) {
      this.recreateController(
        this.props.recUrl,
        this.props.levUrl,
        this.props.shirtUrl
      );
      return;
    }
    if (this.props.recUrl !== prevProps.recUrl && this.props.recUrl) {
      this.changeReplays(this.props.recUrl, this.props.shirtUrl);
      return;
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
      recUrl: this.props.recUrl,
      shirtUrl: this.props.shirtUrl,
    });
  }

  changeReplays = (recUrl, shirtUrl) => {
    const recs = recUrl.split(";");
    this.cnt.changeReplays(recs, shirtUrl);
  };

  recreateController = (recUrl, levUrl, shirtUrl) => {
    this.removeAnimationLoop();

    // Ensure canvas is removed only if it exists
    const canvas = this.playerContainerRef.current.querySelector("canvas");
    if (canvas) {
      canvas.remove();
    }

    this.initPlayer({
      levUrl,
      recUrl,
      shirtUrl,
    });
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
        progress: (currentFrame / maxFrames) * 100,
      });
  };
  initPlayer = (urls) => {
    // Check if canvas already exists before creating a new one
    if (this.playerContainerRef.current.querySelector("canvas")) {
      return;
    }

    controller(
      /*//Legacy way of passing parameters:
      urls.levUrl,
      'https://api.elma.online/recplayer',
      this.playerContainerRef.current,
      document,
      this.frameCallback,
      this.props.autoPlay || false,*/
      {levelUrl: urls.levUrl,
        elem: this.playerContainerRef.current,
        document: document,
        onFrameUpdate: this.frameCallback,
        autoPlay: this.props.autoPlay || false,
        lgrFrom: this.props.lgrFrom || 'level',
        lgrUrl: this.props.lgrUrl || 'https://api.elma.online/lgr/get/',
        defaultLgrUrl: this.props.defaultLgrUrl || 'https://api.elma.online/lgr/get/default',
        legacy_url: this.props.legacyLgrUrl || 'https://api.elma.online/recplayer',
      }
    )((cnt) => {
      this.cnt = cnt;
      this.autoResize();
      if (urls.recUrl) {
        const recs = urls.recUrl.split(";");
        cnt.loadReplays(recs, urls.shirtUrl);
      }
      cnt.player().setScale(this.props.zoom || 0.8);
      if (this.props.levelOptions) {
        const { grass, pictures, customBackgroundSky, arrows } =
          this.props.levelOptions;
        cnt.player().setLevOpts({
          grass: typeof grass === "boolean" ? grass : true,
          pictures: typeof pictures === "boolean" ? pictures : true,
          customBackgroundSky:
            typeof customBackgroundSky === "boolean"
              ? customBackgroundSky
              : true,
          arrows: typeof arrows === "boolean" ? arrows : true,
        });
      }
      if (this.props.onInitialize) {
        this.props.onInitialize(cnt);
      }
      this.enableWakeLock();
      if (this.props.fitLev) {
        cnt.player().fitLev();
      }
      if (!urls.recUrl) {
        if (this.props.showStartPos) {
          cnt.player().startPos();
        }
      }
    });
  };
  autoResize = () => {
    if (this.cnt && this.playerContainerRef.current) {
      let w =
        ((this.props.width == "auto" || this.state.fullscreen) &&
          this.playerContainerRef.current.offsetWidth) ||
        this.props.width;
      let h =
        ((this.props.height == "auto" || this.state.fullscreen) &&
          this.playerContainerRef.current.offsetHeight) ||
        this.props.height;
      this.cnt.resize(w, h);
    }
  };
  playPause = () => {
    if (this.cnt) {
      this.cnt.player().playPause();
      const isPlaying = this.cnt.player().playing();
      if (isPlaying) {
        this.enableWakeLock();
      } else {
        this.disableWakeLock();
      }
      this.setState({
        playing: isPlaying,
      });
      this.props.onPlayPause && this.props.onPlayPause(isPlaying);
    }
  };
  fullscreen = () => {
    this.setState((prevState, props) => {
      return {
        fullscreen: !prevState.fullscreen,
      };
    }, this.autoResize);
  };
  goToFrame = (frame) => {
    if (this.cnt) {
      this.cnt.setFrame(frame);
    }
  };
  progressBarOnMouseDown = (e) => {
    if (this.cnt) {
      this.setState({
        progressBarDrag: true,
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
  progressBarOnTouchMove = (e) => {
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
      progressBarDrag: false,
    });
  };
  progressBarOnTouchEnd = () => {
    if (this._wasPlaying) {
      this.playPause();
    }
    this.setState({
      progressBarDrag: false,
    });
  };
  onMouseMove = (e) => {
    if (this._mouseDown) this._mouseDrag = true;

    if (this.state.progressBarDrag && this._progressBar) {
      let pos =
        (e.pageX - this._progressBar.getBoundingClientRect().left) /
        this._progressBar.offsetWidth;
      if (pos < 0) pos = 0;
      else if (pos > 1) pos = 1;
      this.goToFrame(this.state.maxFrames * pos);
    }
  };
  frameToTimestamp = (frame) => {
    let time = Math.floor((frame * 100) / 30);
    let csec = (time % 100).toString().padStart(2, 0);
    time = Math.floor(time / 100);
    let sec = (time % 60).toString().padStart(2, 0);
    time = Math.floor(time / 60);
    return time > 0 ? time + ":" + sec + ":" + csec : sec + ":" + csec;
  };
  playerContainerOnTouchStart = (e) => {
    this.playerContainerRef.current.focus();

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
  onClick = (e) => {
    if (e.target.localName === "canvas" && !this._mouseDrag) {
      this.playPause();
    }
  };
  onMouseDown = (e) => {
    if (e.target.localName === "canvas") {
      this._mouseDown = true;
    }
  };
  onDoubleClick = (e) => {
    if (e.target.localName === "canvas") {
      this.fullscreen();
    }
  };
  enableWakeLock = async () => {
    if (!this.props.wakeLock) {
      return;
    }

    if (!this.cnt || !this.cnt.player().playing()) {
      return;
    }

    if (document.visibilityState !== "visible") {
      return;
    }

    if (this._wakeLock) {
      return;
    }

    try {
      this._wakeLock = await navigator.wakeLock.request("screen");
      this._wakeLock.addEventListener("release", () => {
        this._wakeLock = null;
      });
    } catch (err) {
      console.error(err);
    }
  };
  disableWakeLock = async () => {
    if (this._wakeLock) {
      await this._wakeLock.release();
      this._wakeLock = null;
    }
  };
  latestApple = () => {
    if (this.cnt && this.cnt.player().appleTimes()) {
      const latestApple = this.cnt
        .player()
        .appleTimes()
        .sort((a, b) => b.frame - a.frame)
        .find((appleTime) => appleTime.frame <= this.state.currentFrame);

      if (latestApple) {
        return {
          apple: latestApple.apple,
          time: this.frameToTimestamp(latestApple.frame),
        };
      }
      return null;
    }
  };
  zoom = (action) => {
    if (this.cnt && this.cnt.player()) {
      const pl = this.cnt.player();
      const scale = pl.scale();
      if (action === "in") {
        pl.setScale(scale * 1.2);
      }
      if (action === "out") {
        pl.setScale(scale / 1.2);
      }
    }
  };
  reverse = () => {
    if (this.cnt && this.cnt.player()) {
      const pl = this.cnt.player();
      const speed = pl.speed();
      pl.setSpeed(-speed);
    }
  };
  speed = (action) => {
    if (this.cnt && this.cnt.player()) {
      const pl = this.cnt.player();
      const speed = pl.speed();
      if (action === "faster") {
        pl.setSpeed(speed / 0.8);
      }
      if (action === "slower") {
        pl.setSpeed(speed * 0.8);
      }
    }
  };
  getSpeed = () => {
    if (this.cnt && this.cnt.player()) {
      const pl = this.cnt.player();
      const speed = pl.speed();
      if (speed) {
        return `${parseFloat(Math.abs(speed)).toFixed(2)}x`;
      }
      return "1.00x";
    }
  };

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
          width: this.props.width === "auto" ? "100%" : this.props.width + "px",
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
          ref={this.playerContainerRef}
        >
          {this.props.controls && (
            <div className="RecPlayer-controls">
              <div
                className="RecPlayer-controls-progress-bar"
                ref={(el) => (this._progressBar = el)}
                onMouseDown={(e) => this.progressBarOnMouseDown(e)}
                onTouchMove={(e) => this.progressBarOnTouchMove(e)}
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
                <div className="Recplayer-controls-text RecPlayer-controls-timestamp">
                  {this.frameToTimestamp(this.state.currentFrame)}
                </div>
                <div
                  className="RecPlayer-controls-button RecPlayer-controls-button-fullscreen"
                  onClick={this.fullscreen}
                  title="Fullscreen"
                >
                  <img src={FullscreenIcon} />
                </div>

                {this.props.showPlaybackBtns ? (
                  <>
                    <div
                      className="RecPlayer-controls-button RecPlayer-controls-button-zoom"
                      onClick={() => this.speed("faster")}
                      title="Faster playback speed"
                    >
                      <img src={ForwardIcon} />
                    </div>
                    <div className="Recplayer-controls-text RecPlayer-controls-speed-text">
                      {this.getSpeed()}
                    </div>
                    <div
                      className="RecPlayer-controls-button RecPlayer-controls-button-zoom"
                      onClick={() => this.speed("slower")}
                      title="Slower playback speed"
                    >
                      <img src={BackwardIcon} />
                    </div>
                    <div
                      className="RecPlayer-controls-button RecPlayer-controls-button-zoom"
                      onClick={() => this.reverse()}
                      title={`Reverse playback`}
                    >
                      <img src={ReverseIcon} />
                    </div>
                  </>
                ) : null}
                {this.props.showZoomBtns ? (
                  <>
                    <div
                      className="RecPlayer-controls-button RecPlayer-controls-button-zoom"
                      onClick={() => this.zoom("in")}
                      title="Zoom in"
                    >
                      <img src={ZoomInIcon} />
                    </div>
                    <div
                      className="RecPlayer-controls-button RecPlayer-controls-button-zoom"
                      onClick={() => this.zoom("out")}
                      title="Zoom out"
                    >
                      <img src={ZoomOutIcon} />
                    </div>
                  </>
                ) : null}
                <div className="Recplayer-controls-text RecPlayer-controls-latest-apple">
                  {this.cnt && this.latestApple() && (
                    <div>
                      {this.latestApple().time} ({this.latestApple().apple})
                    </div>
                  )}
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
