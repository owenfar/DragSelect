```
    ____                   _____      __          __ 
   / __ \_________ _____ _/ ___/___  / /__  _____/ /_
  / / / / ___/ __ `/ __ `/\__ \/ _ \/ / _ \/ ___/ __/
 / /_/ / /  / /_/ / /_/ /___/ /  __/ /  __/ /__/ /_  
/_____/_/   \__,_/\__, //____/\___/_/\___/\___/\__/  
                 /____/                              
```

# Installation
## easy

Just [download the file](https://github.com/ThibaultJanBeyer/DragSelect/blob/master/docs/DragSelect.js) ([minified](https://github.com/ThibaultJanBeyer/DragSelect/blob/master/docs/ds.min.js)) and add it to your document:

```html
<script src="https://thibaultjanbeyer.github.io/DragSelect/ds.min.js"></script>
```

*Note: if you are using `<script type=module` you can use the `DragSelect.es6m.js` or `ds.es6m.min.js` files as they include `export default DragSelect`*

## npm
```console
npm install --save dragselect
```

## bower
```console
bower install --save dragselect
```

That's it, you're ready to rock!  
Of course you can also just include the code within your code to save a request.  

DragSelect supports `module.exports`, `AMD Modules` with `define` and has a fallback to global namespace for maximum out of the box support.

# Usage

Now in your JavaScript you can simply pass elements to the function like so:

## simple

The simplest possible usage.  
Choose which elements can be selected:

```javascript
new DragSelect({
  selectables: document.getElementsByClassName('selectable-nodes')
});
```

<p data-height="265" data-theme-id="0" data-slug-hash="prpwYG" data-default-tab="js,result" data-user="ThibaultJanBeyer" data-embed-version="2" data-pen-title="prpwYG" class="codepen">See the Pen <a href="https://codepen.io/ThibaultJanBeyer/pen/prpwYG/">prpwYG</a> on CodePen.</p>

## Within a scroll-able Area

Here the selection is constrained. You can only use the selection inside of the container with the red border:

<p data-height="265" data-theme-id="0" data-slug-hash="Nvobgq" data-default-tab="js,result" data-user="ThibaultJanBeyer" data-embed-version="2" data-pen-title="DragSelect with Scrollable AREA" class="codepen">See the Pen <a href="https://codepen.io/ThibaultJanBeyer/pen/Nvobgq/">DragSelect with Scrollable AREA</a> on CodePen.</p>

## extended

All options are optional. You could also just initiate the Dragselect by `new DragSelect();` without any option.  
Find all possible properties and methods in **[the docs](https://thibaultjanbeyer.github.io/DragSelect/DragSelect.html)**  

```javascript
var ds = new DragSelect({

  // node/nodes that can be selected.
  // This is also optional, you could just add them later with .addSelectables().
  selectables: document.getElementsByClassName('selectable-nodes'),
  // draggable element. By default one will be created.
  selector: document.getElementById('rectangle'),
  // area in which you can drag. If not provided it will be the whole document.
  area: document.getElementById('area'), 
  // If set to true, no styles (except for position absolute) will be applied by default.
  customStyles: false,
  // special keys that allow multiselection. Default value below.
  multiSelectKeys: ['ctrlKey', 'shiftKey', 'metaKey'],
  // If set to true, the multiselection behavior will be turned on by default without pressing
  // modifier keys. Default: false
  multiSelectMode: false,
  // Speed in which the area scrolls while selecting (if available).
  // Unit is pixel per movement. Set to 0 to disable autoscrolling. Default = 1
  autoScrollSpeed: 3,

  // fired when the user clicks in the area. This callback gets the event object.
  // Executed after DragSelect function code ran, before the setup of event listeners.
  onDragStart: function(element) {},
  // fired when the user drags. This callback gets the event object.
  // Executed before DragSelect function code ran, after getting the current mouse position.
  onDragMove: function(element) {},
  // fired every time an element is selected. (element) = just selected node
  onElementSelect: function(element) {},
  // fired every time an element is de-selected. (element) = just de-selected node.
  onElementUnselect: function(element) {},
  // fired once the user releases the mouse. (elements) = selected nodes.
  callback: function(elements) {}

});

// if you add the function to a variable like we did, you have access to all its functions
// and can now use start() and stop() like so:
ds.getSelection(); // returns all currently selected nodes

// adds elements that can be selected. Intelligent algorithm never adds elements twice.
ds.addSelectables(document.getElementsByClassName('selectable-node'));

// used in callbacks to disable the execution of the upcoming code.
// It will not teardown the functionality.
ds.break(); 

ds.stop();  // will teardown/stop the whole functionality
ds.start(); // reset the functionality after a teardown

// and many more, see "methods" section in documentation
```  

*You can also use the "shift", "ctrl" or "command" key to make multiple independent selections.*

## Mobile/Touch useage

Keep in mind that using DragSelect on a mobile/touch device will also turn off the default scroll behaviour (on `click` + `drag` interaction).
In 99% of the usecases, this is what you want. If DragSelect is only one part of a website, and you still want to be able to scroll the page on mobile, you can use an `area` [property](#properties). This way the scroll behaviour remains for all the rest of the page.

## Accessibility (a11y)

DragSelect is accessibly by default:  

> TLDR; => Your `selectables` should be buttons: `<button type="button"></button>`.  

Obviously, keyboard users won’t get the full visual experience but it works similarely to the OS default behaviour. You can select items using the default select keys (usually space or enter) and also multiselect when using a modifier key at the same time (unfortunately this does not work in firefox for now since FF doesn’t add the modifier key in the event object when using the keyboard). There is one little thing you have to do tho’: the `selectables` have to be pressable (clickable)! To achieve this, they should be of type `<button type="button"></button>`.  

<p data-height="265" data-theme-id="0" data-slug-hash="prpwYG" data-default-tab="html,result" data-user="ThibaultJanBeyer" data-embed-version="2" data-pen-title="DragSelect" class="codepen">See the Pen <a href="https://codepen.io/ThibaultJanBeyer/pen/prpwYG/">DragSelect</a> on CodePen.</p>

# Properties:

Full list of properties is found in **[the docs](https://thibaultjanbeyer.github.io/DragSelect/DragSelect.html)**  
Here are some properties for your convenience (not all):  

| property | type | usage |
|--- |--- |--- |
|selectables |DOM elements (nodes) |OPTIONAL. The elements that can be selected |
|selector |single DOM element (node) |OPTIONAL. The square that will draw the selection. Autocreated by default |
|area |single DOM element (node) |OPTIONAL. The square in which you are able to select |
|customStyles |boolean |OPTIONAL. If true, no styles will be automatically applied (except position: absolute). Default: `false` |
|multiSelectKeys |array |OPTIONAL. An array of keys that allows switching to the multi-select mode (see the multiSelectMode option). The only possible values are keys that are provided via the event object. So far: <kbd>ctrlKey</kbd>, <kbd>shiftKey</kbd>, <kbd>metaKey</kbd> and <kbd>altKey</kbd>. Provide an empty array `[]` if you want to turn off the funcionality. Default: `['ctrlKey', 'shiftKey', 'metaKey']` |
|multiSelectMode |boolean |OPTIONAL. Add newly selected elements to the selection instead of replacing them. Default = `false` |
|autoScrollSpeed |integer |OPTIONAL. The speed in which the area scrolls while selecting (if available). The unit is pixel per movement. Set to `0.0001` to disable autoscrolling. Default = `1` |
|selectedClass |string |OPTIONAL. The class name assigned to the selected items. Default = [see classes](#classes) |
|hoverClass |string |OPTIONAL. The class name assigned to the mouse hovered items. Default = [see classes](#classes) |
|selectorClass |string |OPTIONAL. The class name assigned to the square selector helper. Default = [see classes](#classes) |
|selectableClass |string |OPTIONAL. The class name assigned to the elements that can be selected. Default = [see classes](#classes) |
|onDragStartBegin |function |OPTIONAL. Fired when the user clicks in the area. This callback gets the event object. Executed **before** DragSelect function code runs |
|onDragStart |function |OPTIONAL. Fired when the user clicks in the area. This callback gets the event object. Executed after DragSelect function code ran, befor the setup of event listeners |
|onDragMove |function |OPTIONAL. Fired when the user drags. This callback gets the event object. Executed before DragSelect function code ran, after getting the current mouse position |
|onElementSelect |function |OPTIONAL. Fired every time an element is selected. This callback gets a property which is the selected node |
|onElementUnselect |function |OPTIONAL. Fired every time an element is de-selected. This callback gets a property which is the de-selected node |
|callback |function |OPTIONAL. Callback function that gets fired when the selection is released. This callback gets a property which is an array that holds all selected nodes |

# Methods:
When the function is saved into a variable `var foo = new DragSelect()` you have access to all its inner functions.  
There are way more than listed here. You can find all in **[the docs](https://thibaultjanbeyer.github.io/DragSelect/DragSelect.html)**. Here are just the most usable:  

| method | properties | usage |
|--- |--- |--- |
|stop |/ |Will teardown/stop the whole functionality |
|start |/ |Reset the functionality after a teardown |
|break |/ |Used in callbacks to disable the execution of the upcoming code. It will not teardown the functionality |
|getSelection |/ |Returns all currently selected nodes |
|addSelection |DOM elements (nodes), Boolean (callback), Boolean (dontAddToSelectables) |adds one or multiple elements to the selection. If boolean is set to true: callback will be called afterwards. By default, it checks if all elements ere alos in the list of selectables and adds them if not (can be turned off by setting the last boolean to true) |
|removeSelection |DOM elements (nodes), Boolean (callback), Boolean (removeFromSelectables) |removes one or multiple elements to the selection. If boolean is set to true: callback will be called afterwards. If last bolean is set to true, it also removes them from the possible selectable nodes if they were. |
|toggleSelection |DOM elements (nodes), Boolean (callback), Boolean (special) |toggles one or multiple elements to the selection. If element is not in selection it will be added, if it is already selected, it will be removed. If boolean is set to true: callback will be called afterward. If last boolean is set to true, it also removes selected elements from possible selectable nodes & doesn’t add them to selectables if they are not. |
|setSelection |DOM elements (nodes), Boolean (callback), Boolean (dontAddToSelectables) |sets the selection to one or multiple elements. If boolean is set to true: callback will be called afterwards. By default, it checks if all elements ere alos in the list of selectables and adds them if not (can be turned off by setting the last boolean to true) |
|clearSelection |DOM elements (nodes), Boolean (callback) |remove all elements from the selection. If boolean is set to true: callback will be called afterwards. |
|addSelectables |DOM elements (nodes), Boolean (addToSelection) |Adds elements that can be selected. Don’t worry, a smart algorithm makes sure that nodes are never added twice. If boolean is set to true: elements will also be added to current selection. |
|removeSelectables |DOM elements (nodes), Boolean (removeFromSelection) |Remove elements that can be selected. If boolean is set to true: elements will also be removed from current selection. |
|getSelectables |/ |Returns array with all nodes that can be selected. |
|setSelectables |DOM elements (nodes), Boolean (removeFromSelection), Boolean (addToSelection) |Sets all elements that can be selected. Removes all current selectables (& their respective applied classes). Adds the new set to the selectables set. Thus, replacing the original set. First boolean if old elements should be removed from the selection. Second boolean if new elements should be added to the selection. |
|getInitialCursorPosition |/ |Returns the registered x, y coordinates the cursor had when first clicked |
|getCurrentCursorPosition |/ |Returns current/last registered x, y coordinates of the cursor |
|getCursorPositionDifference |Boolean (usePreviousCursorDifference) |Returns object with the x, y difference between the initial and the last cursor position. If the argument is set to true, it will instead return the x, y difference to the previous selection |
|getCursorPos |Event, Node (_area), Boolean (ignoreScroll) |Returns the cursor x, y coordinates *based on a click event object*. The click event object is required. By default, takes scroll and area into consideration. Area is this.area by default and can be fully ignored by setting the second argument explicitely to false. Scroll can be ignored by setting the third argument to true. |

# Classes
| name | trigger |
|--- |--- |
|.ds-selected |On elements that are selected
|.ds-hover |On elements that are currently hovered
|.ds-selector |On the selector element
|.ds-selectable |On elements that can be selected

*note: you can change the class names setting the respective property on the constructor, see **[the docs](https://thibaultjanbeyer.github.io/DragSelect/DragSelect.html)** properties section.*

# Have Fun!

Creating and maintaining useful tools is a lot of work. 
So don’t forget to give this repository a star if you find it useful.
Star this repo, tell all your friends and start contributing or [donating 1$](https://paypal.me/pools/c/8gF2a5szCP) to keep it running. Thank you :)

[![Typewriter Gif](https://thibaultjanbeyer.github.io/DragSelect/typewriter.gif)](http://thibaultjanbeyer.com/)


<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
<br>
<br>
<br>

[documentation](https://thibaultjanbeyer.github.io/DragSelect/DragSelect.html)
