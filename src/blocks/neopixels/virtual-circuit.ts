import type {
  SyncComponent,
  ResetComponent,
} from "../../core/virtual-circuit/svg-sync";
import type {
  PositionComponent,
  CreateWire,
  CreateCompenentHook,
} from "../../core/virtual-circuit/svg-create";

import type { Element, Svg } from "@svgdotjs/svg.js";
import {
  createWire,
  createPowerWire,
  createGroundWire,
} from "../../core/virtual-circuit/wire";
import { ARDUINO_PINS } from "../../core/microcontroller/selectBoard";
import _ from "lodash";
import { rgbToHex } from "../../core/blockly/helpers/color.helper";
import { positionComponent } from "../../core/virtual-circuit/svg-position";
import type { NeoPixelState } from "./state";

export const neoPixelCreate: CreateCompenentHook<NeoPixelState> = (
  state,
  neoPixelEl
) => {
  showRGBStripLeds(neoPixelEl, state);
  neoPixelEl.findOne("#DATA_TEXT").node.innerHTML = state.pins[0];
};

export const neoPixelPosition: PositionComponent<NeoPixelState> = (
  state,
  neoPixelEl,
  arduino,
  draw,
  board
) => {
  positionComponent(
    neoPixelEl,
    arduino,
    draw,
    ARDUINO_PINS.PIN_A2,
    "PIN_DATA",
    board
  );
  neoPixelEl.x(neoPixelEl.x() - 100);
};

export const neoPixelReset: ResetComponent = (neoPixelEl: Element) => {
  for (let i = 1; i <= 60; i += 1) {
    const ledEl = neoPixelEl.findOne(`#LED-${i} circle`) as Element;
    if (ledEl) {
      ledEl.fill("#000000");
    }
  }
};

export const neoPixelUpdate: SyncComponent = (
  state: NeoPixelState,
  neoPixelEl
) => {
  state.neoPixels.forEach((led) => {
    const ledEl = neoPixelEl.findOne(
      `#LED-${led.position + 1} circle`
    ) as Element;
    if (ledEl) {
      ledEl.fill(rgbToHex(led.color));
    }
  });
};

export const createWiresNeoPixels: CreateWire<NeoPixelState> = (
  state,
  draw,
  neoPixelEl,
  arduino,
  id,
  board
) => {
  createWire(
    neoPixelEl,
    state.pins[0],
    "PIN_DATA",
    arduino,
    draw,
    "#006837",
    "data",
    board
  );

  createGroundWire(
    neoPixelEl,
    ARDUINO_PINS.PIN_13,
    arduino as Svg,
    draw,
    id,
    "left",
    board
  );

  createPowerWire(
    neoPixelEl,
    ARDUINO_PINS.PIN_13,
    arduino as Svg,
    draw,
    id,
    "left",
    board
  );
};

const showRGBStripLeds = (
  neoPixelEl: Element,
  neoPixelState: NeoPixelState
) => {
  _.range(1, 60 + 1).forEach((index) => {
    if (index <= neoPixelState.numberOfLeds) {
      neoPixelEl.findOne(`#LED_${index}`).show();
    } else {
      neoPixelEl.findOne(`#LED_${index}`).hide();
    }
  });
  if (neoPixelState.numberOfLeds > 48) {
    neoPixelEl.findOne("#LEVEL1").show();
    neoPixelEl.findOne("#LEVEL2").show();
    neoPixelEl.findOne("#LEVEL3").show();
    neoPixelEl.findOne("#LEVEL4").show();
  } else if (
    neoPixelState.numberOfLeds >= 37 &&
    neoPixelState.numberOfLeds <= 48
  ) {
    neoPixelEl.findOne("#LEVEL1").show();
    neoPixelEl.findOne("#LEVEL2").show();
    neoPixelEl.findOne("#LEVEL3").show();
    neoPixelEl.findOne("#LEVEL4").hide();
  } else if (
    neoPixelState.numberOfLeds >= 25 &&
    neoPixelState.numberOfLeds < 37
  ) {
    neoPixelEl.findOne("#LEVEL1").show();
    neoPixelEl.findOne("#LEVEL2").show();
    neoPixelEl.findOne("#LEVEL3").hide();
    neoPixelEl.findOne("#LEVEL4").hide();
  } else if (
    neoPixelState.numberOfLeds >= 13 &&
    neoPixelState.numberOfLeds <= 24
  ) {
    neoPixelEl.findOne("#LEVEL1").show();
    neoPixelEl.findOne("#LEVEL2").hide();
    neoPixelEl.findOne("#LEVEL3").hide();
    neoPixelEl.findOne("#LEVEL4").hide();
  } else if (neoPixelState.numberOfLeds < 12) {
    neoPixelEl.findOne("#LEVEL1").hide();
    neoPixelEl.findOne("#LEVEL2").hide();
    neoPixelEl.findOne("#LEVEL3").hide();
    neoPixelEl.findOne("#LEVEL4").hide();
  }
};