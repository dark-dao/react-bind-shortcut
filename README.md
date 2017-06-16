# react-bind-shortcut

The component that receives the values of the pressed keyboard keys

[![NPM](https://nodei.co/npm/react-bind-shortcut.png)](https://nodei.co/npm/react-bind-shortcut/)
# How use
```js
import KeyBinding from 'react-bind-shortcut';

  ...

const ReactComponent = React.createClass({

  ...

  holdKeyChanged(holdKey) {
    // hold key name
  },
  pressKeyChanged(keysPressed) {
    // pressed keys or shortcuts names
  },

  ...

});

const boundKeys = [
'Enter',
'ESC',
'shIFt'
];

const boundShortcuts = [
'SHIFT + A',
'alt+b',
'Ctrl + C'
];

const holdTimer = 500;

export default KeyBinding(ReactComponent, boundKeys, boundShortcuts, holdTimer);

// or without holdTimer:
//default holdTimer = 1000
export default KeyBinding(ReactComponent, boundKeys, boundShortcuts);

// if not pass boundKeys and boundShortcuts, then the method pressKeyChanged()
// will be called when any keys are pressed
export default KeyBinding(ReactComponent);

```
