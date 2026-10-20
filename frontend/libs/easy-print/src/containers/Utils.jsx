/* eslint-disable quotes */
import React from 'react';
import { Line } from 'react-konva';
/**
 * Allows downlaoding the given data as a file
 * @param {*} filename
 * @param {*} data
 */

// Declare the size of grid block
export const gridSize = 15;

// Calculate the number of squares for Editor stage
export const gridGenerate = (width, height, gridSize) => {
  const grid = {
    widthLines: [],
    heightLines: [],
  };
  for (let i = 0; i < width / gridSize; i++) {
    grid.widthLines.push(
      <Line
        key={`line_width_${i}`}
        points={[
          Math.round(i * gridSize) + 0.5,
          0,
          Math.round(i * gridSize) + 0.5,
          height,
        ]}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
  }
  for (let j = 0; j < height / gridSize; j++) {
    grid.heightLines.push(
      <Line
        key={`line_height_${j}`}
        points={[0, Math.round(j * gridSize), width, Math.round(j * gridSize)]}
        stroke="#ddd"
        strokeWidth={1}
      />
    );
  }
  return grid;
};

// Declare dragBound for item in editor panel
export const dragBoundItem = (pos, layout, item, rotation) => {
  const edgeBound = {
    left: 5,
    top: 5,
    right: layout.width.pixel - layout.marginRight - layout.marginLeft - 5,
    bottom: layout.height.pixel - layout.marginTop - layout.marginBottom,
  };
  switch (rotation) {
    case 90:
      edgeBound.left += item.height;
      edgeBound.bottom -= item.width;
      break;
    case 180:
      edgeBound.left += item.width;
      edgeBound.top += item.height;
      break;
    case 270:
      edgeBound.right -= item.height;
      edgeBound.top += item.width;
      break;
    default:
      edgeBound.right -= item.width;
      edgeBound.bottom -= item.height;
      break;
  }
  const newX =
    pos.x < edgeBound.left
      ? edgeBound.left
      : pos.x > edgeBound.right
      ? edgeBound.right
      : pos.x;

  const newY =
    pos.y < edgeBound.top
      ? edgeBound.top
      : pos.y > edgeBound.bottom
      ? edgeBound.bottom
      : pos.y;
  return {
    x: newX,
    y: newY,
  };
};

//Extract data for label type variable
export const extractLabelValue = (fields, object = {}) => {
  if (!fields) return '';
  return object[fields];
};

export function download(filename, data) {
  var blob = new Blob([JSON.stringify(data)], { type: 'text/csv' });

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename + '.json';
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}

/**
 *  Printing image
 */

function ImagetoPrint(source) {
  // Maybe also scale the image and page size to label size?
  return (
    '<html><head><script>function step1(){\n' +
    "setTimeout('step2()', 10);}\n" +
    'function step2(){window.print();window.close()}\n' +
    "</script></head><body onload='step1()'>\n" +
    "<img src='" +
    source +
    "' /></body></html>"
  );
}

export function PrintImage(source, labeljson, printername, copies) {
  if (window.qtside) {
    // Only need the labeldata as JSON on QtSide
    // File it_pos_app/Printer.py handles this call!
    window.qtside.printer.printLabel(labeljson, printername, copies);
  } else if (window.pywebview?.api?.printer) {
    window.pywebview.api.printer.printLabel(labeljson, printername, copies);
  } else {
    var Pagelink = 'about:blank';
    var pwa = window.open(Pagelink, '_new');
    pwa.document.open();
    pwa.document.write(ImagetoPrint(source));
    pwa.document.close();
  }
}

/*converting pixels to mm and mm to pixels for page settings*/
const DPI = getDPI();
export function mmToPixel(mm) {
  return Math.round((mm * DPI) / 25.4);
}

export function pixelToMm(pixel) {
  return Math.round((pixel * 25.4) / DPI);
}

function getDPI() {
  return (
    document.getElementById('dpi') &&
    document.getElementById('dpi').offsetHeight
  );
}
