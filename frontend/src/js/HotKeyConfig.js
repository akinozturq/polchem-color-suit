import { configure } from 'react-hotkeys';

export function configureHotKeys() {
  configure({
    /**
     * The level of logging of its own behaviour React HotKeys should perform.
     */
    logLevel: 'warn',

    /**
     * Default key event key maps are bound to (keydown|keypress|keyup)
     */
    defaultKeyEvent: 'keypress',

    /**
     * The default component type to wrap HotKey components' children in, to provide
     * the required focus and keyboard event listening for HotKeys to function
     */
    defaultComponent: 'div',

    /**
     * The default tabIndex value passed to the wrapping component used to contain
     * HotKey components' children. -1 skips focusing the element when tabbing through
     * the DOM, but allows focusing programmatically.
     */
    defaultTabIndex: '-1',

    /**
     * The HTML tags that React HotKeys should ignore key events from. This only works
     * if you are using the default ignoreEventsCondition function.
     * @type {String[]}
     */
    ignoreTags: ['input', 'select', 'textarea'],

    /**
     * The function used to determine whether a key event should be ignored by React
     * Hotkeys. By default, keyboard events originating elements with a tag name in
     * ignoreTags, or a isContentEditable property of true, are ignored.
     *
     * @type {Function<KeyboardEvent>}
     * ignoreEventsCondition: function,
     */

    /**
     * Whether to ignore changes to keyMap and handlers props by default
     * (this reduces a significant amount of unnecessarily resetting
     * internal state)
     * @type {boolean}
     */
    ignoreKeymapAndHandlerChangesByDefault: true,

    /**
     * Whether to ignore repeated keyboard events when a key is being held down
     * @type {boolean}
     */
    ignoreRepeatedEventsWhenKeyHeldDown: false,

    /**
     * Whether React HotKeys should simulate keypress events for the keys that do not
     * natively emit them.
     * @type {boolean}
     */
    simulateMissingKeyPressEvents: true,

    /**
     * Whether to call stopPropagation() on events after they are
     * handled (preventing the event from bubbling up any further, both within
     * React Hotkeys and any other event listeners bound in React).
     *
     * This does not affect the behaviour of React Hotkeys, but rather what
     * happens to the event once React Hotkeys is done with it (whether it's
     * allowed to propagate any further through the Render tree).
     */
    stopEventPropagationAfterHandling: true,

    /**
     * Whether to call stopPropagation() on events after they are
     * ignored (preventing the event from bubbling up any further, both within
     * React Hotkeys and any other event listeners bound in React).
     *
     * This does not affect the behaviour of React Hotkeys, but rather what
     * happens to the event once React Hotkeys is done with it (whether it's
     * allowed to propagate any further through the Render tree).
     */
    stopEventPropagationAfterIgnoring: true,

    /**
     * Whether to allow combination submatches - e.g. if there is an action
     * bound to cmd, pressing shift+cmd will *not* trigger that action when
     * allowCombinationSubmatches is false.
     */
    allowCombinationSubmatches: false,

    /**
     * A mapping of custom key codes to key names that you can then use in your
     * key sequences
     */
    customKeyCodes: {},
  });
}
