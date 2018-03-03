# recplayer-react
React component for recplayer

## Example usage
Run
```npm install git+https://github.com/ville-j/recplayer-react.git```

Note: You might need to configure Webpack loader for Babel to process the files in ```node_modules/recplayer-react/``` folder

```
import RecPlayer from "recplayer-react";

<RecPlayer
  recUrl="url"
  levUrl="url"
  width="auto"
  height="auto"
  scale={0.7}
/>
```

The ```width``` and ```height``` properties can be set either as pixel values, or as "auto" in which case the player will be resized to the size of the parent element. The ```scale``` property sets the initial zoom level of the player. The ```recUrl``` and ```levUrl``` are of course the urls of the files that should be loaded.
