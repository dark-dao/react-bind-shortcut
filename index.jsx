'use strict';
/*
 *
 * boundKeys - [Array] - An array whose elements are the names of the keys
 * boundShortcuts - [Array] - Array elements of which are the names of key combinations
 * holdTimer - [int] - The value of the timer (ms), at the expiration of which the event "hold" of the key
 * pressKeyChanged(keysPressed) - Method called in the child component
 * holdKeyChanged(shortcutPressed) - Method called in the child component to get the hold shortcuts
 *
 * If not pass boundKeys and boundShortcuts, then the method pressKeyChanged() will be called when any keys are pressed
 *
 */
import React from 'react';
import _ from 'lodash';

const HOLD_TIMER = 1000;

const NUMBERS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FN_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // F1 - F12
const SPECIAL_KEY_CODES = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    INSERT: 45,
    DELETE: 46,
    'NUMPAD_ *': 106,
    'NUMPAD_ +': 107,
    'NUMPAD_ -': 109,
    'NUMPAD_ .': 110,
    'NUMPAD_ /': 111,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    PRINT_SCREEN: 154,
    ';': 186,
    '=': 187,
    ',': 188,
    '-': 189,
    '.': 190,
    '/': 191,
    '`': 192,
    '[': 219,
    '\\': 220,
    ']': 221,
    "'": 222
};
const MODIFIERS = {
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    META: 157,
    CMD: 157,
    COMMAND: 157
};
const getAllKeys = function() {
    let keysObj = SPECIAL_KEY_CODES;
    const BTN_ZERO_CODE = 48;
    const BTN_LETTER_A_CODE = 65;
    const BTN_NUMPAD_ZERO_CODE = 96;
    const BTN_F1_CODE = 112;
    let numbers = _.map(NUMBERS.split(''), (number, index) => {
        let keyIndex = BTN_ZERO_CODE + index;
        let numPadKeyIndex = BTN_NUMPAD_ZERO_CODE + index;
        keysObj = _.assign({}, keysObj, {[number]: keyIndex}, {[`NUMPAD_${ number }`]: numPadKeyIndex});
    });
    let letters = _.map(LETTERS.split(''), (letter, index) => {
        let letterIndex = BTN_LETTER_A_CODE + index;
        keysObj = _.assign({}, keysObj, {[letter]: letterIndex});
    });
    let fnKeys = _.map(FN_KEYS, (letter, index) => {
        let funcKeyIndex = BTN_F1_CODE + index;
        keysObj = _.assign({}, keysObj, {[`F-${ index + 1 }`]: funcKeyIndex});
    });
    return _.assign({}, keysObj, MODIFIERS);
};

const KEYS = getAllKeys();

export default (WrappedComponent, boundKeys, boundShortcuts, holdTimer) => {
    return class extends React.Component {
        constructor(props) {
            super(props);

            let bindAnyKeys = (!boundKeys && !boundShortcuts);
            let boundKeysToUppercase = _.map(boundKeys, key => {
                return key.toUpperCase();
            });

            this.state = {
                bindAnyKeys,
                keysPressed: [],
                boundKeys: boundKeysToUppercase || [],
                boundShortcuts: boundShortcuts || [],
                time: null,
                holdTimer: holdTimer || HOLD_TIMER
            };
            this.handleKeyDown = this.handleKeyDown.bind(this);
            this.handleKeyUp = this.handleKeyUp.bind(this);
        }
        keyMapper(code) {
            return _.findKey(KEYS, val => {
                return code === val;
            });
        }
        componentDidMount() {
            document.addEventListener('keydown', this.handleKeyDown, false);
            document.addEventListener('keyup', this.handleKeyUp, false);
        }
        componentWillUnmount() {
            document.removeEventListener('keydown', this.handleKeyDown, false);
            document.removeEventListener('keyup', this.handleKeyUp, false);
        }
        handlePressKeyEvent(pressedKeyNames) {
            let isMatchesBoundKeys = (_.size(_.difference(this.state.keysPressed, this.state.boundKeys)) === 0);
            let isMatchesBoundShortcuts = _.find(this.state.boundShortcuts, shortcut => {
                return pressedKeyNames === this.findShortcutMatchingPressedKeys();
            });
            if(_.isFunction(this.refs.wrappedComponent.pressKeyChanged) && (isMatchesBoundKeys || isMatchesBoundShortcuts || this.state.bindAnyKeys)) {
                this.refs.wrappedComponent.pressKeyChanged(pressedKeyNames);
            }
        }
        handleKeyDown(e) {
            const keyPressed = this.keyMapper(e.witch || e.keyCode);
            let { keysPressed } = this.state;

            let keyCombo = _.cloneDeep(keysPressed);
            keyCombo.push(keyPressed);

            let isPressedBefore = (_.size(_.difference(keyCombo, keysPressed)) === 0);

            if(!isPressedBefore) {
                this.setState({
                    keysPressed: keyCombo,
                    time: new Date().getTime()
                });
                this.handlePressKeyEvent(keyPressed);
            } else {
                this.handleHoldKey(keyPressed);
            }

            let comboName = this.findShortcutMatchingPressedKeys();
            if(comboName) {
                this.handlePressKeyEvent(comboName);
            }
        }
        handleKeyUp(e) {
            this.handleClear();
        }
        sequenceCheck(verifiablePart, originalArray) {
            let index = 0;
            let isMatchesSequence = false;
            for(let i = 0; i < _.size(originalArray); i++) {
                if(verifiablePart[i] === originalArray[i]) {
                    index++;
                }
            }
            isMatchesSequence = (_.size(originalArray) === index);
            return isMatchesSequence;
        }
        findShortcutMatchingPressedKeys() {
            let { boundShortcuts, bindAnyKeys } = this.state;
            let comboName = null;

            let boundShortcutKeyArray = _.map(boundShortcuts, shortcut => {
                let shortcutPath = shortcut.replace(/\s/g, '').toUpperCase();
                shortcutPath = shortcutPath.split('+');
                return shortcutPath;
            });

            _.map(boundShortcutKeyArray, shortcutKeys => {
                if(this.sequenceCheck(this.state.keysPressed, shortcutKeys)) {
                    comboName = shortcutKeys.toString();
                    comboName = comboName.replace(/[,]/g, ' + ');
                }
            });
            return comboName;
        }
        handleHoldKey(key) {
            let time = new Date().getTime();
            let diff = time - this.state.time;
            let isMatchesBoundKeys = (_.size(_.difference(this.state.keysPressed, this.state.boundKeys)) === 0);
            if(diff >= this.state.holdTimer && isMatchesBoundKeys) {
                if(_.isFunction(this.refs.wrappedComponent.holdKeyChanged)) {
                    this.refs.wrappedComponent.holdKeyChanged(key);
                    this.handleClear();
                }
            }
        }
        handleClear() {
            this.setState({
                keysPressed: [],
                time: null
            });
        }
        render() {
            return (
                <WrappedComponent ref="wrappedComponent" {...this.props} {...this.state}/>
            );
        }
    }
};
