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
      playing: true,
      fullscreen: false
    };
  }
  componentWillReceiveProps(nextProps) {
    this.removeAnimationLoop();
    this.playerContainer.querySelector("canvas").remove();
    this.initPlayer({
      levUrl: nextProps.levUrl,
      recUrl: nextProps.recUrl
    });
  }
  componentDidMount() {
    window.addEventListener("resize", this.autoResize);
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
    window.removeEventListener("resize", this.autoResize);
    this.removeAnimationLoop();
  }
  initPlayer = urls => {
    controller(
      urls.levUrl,
      "http://www.recsource.tv/images",
      this.playerContainer,
      document
    )(cnt => {
      this.cnt = cnt;
      this.autoResize();
      cnt.loadReplay(urls.recUrl);
      cnt.player().setScale(this.props.zoom || 0.8);
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
    this.cnt.player().playPause();
    this.setState((prevState, props) => {
      return {
        playing: !prevState.playing
      };
    });
  };
  fullscreen = () => {
    this.setState((prevState, props) => {
      return {
        fullscreen: !prevState.fullscreen
      };
    }, this.autoResize);
  };
  render() {
    return (
      <div
        style={{
          height: this.props.height === "auto" ? "100%" : this.props.height + "px",
          width: this.props.width === "auto" ? "100%" : this.props.width + "px"
        }}
        className={
          this.state.fullscreen ? "RecPlayer RecPlayer-fullscreen" : "RecPlayer"
        }
      >
        <div
          className="RecPlayer-player-container"
          ref={element => {
            this.playerContainer = element;
          }}
        >
          {this.props.controls && (
            <div className="RecPlayer-controls">
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
              <div
                className="RecPlayer-controls-button RecPlayer-controls-button-fullscreen"
                onClick={this.fullscreen}
              >
                <img src={FullscreenIcon} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RecPlayer;
