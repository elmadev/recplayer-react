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
/>
```

The `width` and `height` properties can be set either as pixel values, or as "auto" in which case the player will be resized to the size of the parent element. The `zoom` property sets the initial zoom level of the player. The `recUrl` and `levUrl` are of course the urls of the files that should be loaded. If you add `controls` property to the component player controls will be overlaid on the player.
