import React, { Component } from "react";
import controller from "recplayer";
import "./RecPlayer.css";

class RecPlayer extends Component {
  componentWillReceiveProps(nextProps) {
    this.removeWindowHandles();
    this.playerContainer.querySelector("canvas").remove();
    this.initPlayer({
      levUrl: nextProps.levUrl,
      recUrl: nextProps.recUrl
    });
  }
  componentWillMount() {
    window.addEventListener("resize", this.autoResize);
  }
  componentDidMount() {
    this.initPlayer({
      levUrl: this.props.levUrl,
      recUrl: this.props.recUrl
    });
  }
  removeWindowHandles = () => {
    if (this.cnt) {
      this.cnt.removeAnimationLoop();
    }
  };
  componentWillUnmount() {
    window.removeEventListener("resize", this.autoResize);
    this.removeWindowHandles();
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
      window.pl.setScale(this.props.zoom || 0.8);
    });
  };
  autoResize = () => {
    if (this.cnt && this.playerContainer) {
      let w =
        (this.props.width == "auto" && this.playerContainer.offsetWidth) ||
        this.props.width;
      let h =
        (this.props.height == "auto" && this.playerContainer.offsetHeight) ||
        this.props.height;
      this.cnt.resize(w, h);
    }
  };
  render() {
    return (
      <div
        style={{
          height: "100%"
        }}
        className="RecPlayer"
        ref={element => {
          this.playerContainer = element;
        }}
      />
    );
  }
}

export default RecPlayer;
