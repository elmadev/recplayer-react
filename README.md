# recplayer-react

React component for recplayer.

## Example usage

Run
`npm install recplayer-react`

```
import RecPlayer from "recplayer-react";

<RecPlayer
  recUrl="http://janka.la:5050/downloads/brec/129645"
  levUrl="http://janka.la:5050/downloads/lev/398698"
  width="auto"
  height={200}
  zoom={0.7}
  controls
  autoPlay
  wakeLock
  imageUrl="http://www.recsource.tv/images"
  onInitialize={cnt => someFunction(cnt)}
  levelOptions={{
    grass: true,
    pictures: true,
    customBackgroundSky: true,
  }}
/>
```

The `width` and `height` properties can be set either as pixel values, or as "auto" in which case the player will be resized to the size of the parent element. The `zoom` property sets the initial zoom level of the player. The `recUrl` and `levUrl` are of course the urls of the files that should be loaded. If you add `controls` property to the component player controls will be overlaid on the player. With `autoPlay` property you can control whether the the playback of the replay will start automatically or not, default value is `false`. You can pass in a custom url where the recplayer will load the images with the `imageUrl` property. Use `wakeLock` prop to prevent display going off during a replay playback (implemented using the wakeLock api https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
