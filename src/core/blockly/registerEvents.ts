import updateForLoopText from "./actions/updateForLoopText";
import type { WorkspaceSvg } from "blockly";
import _ from "lodash";

import codeStore from "../../stores/code.store";
import frameStore from "../../stores/frame.store";
import { getArduinoCode } from "./helpers/workspace.helper";

import { getAllBlocks } from "./helpers/block.helper";
import { transformBlock } from "./transformers/block.transformer";
import { transformEvent } from "./transformers/event.transformer";
import { getAllVariables } from "./helpers/variable.helper";
import { deleteUnusedVariables } from "./actions/deleteUnusedVariables";
import { saveSensorSetupBlockData } from "./actions/saveSensorSetupBlockData";
import { updateLoopNumberInSensorSetupBlock } from "./actions/updateLoopNumberInSensorSetupBlock";
import { updateSensorSetupFields } from "./actions/updateSensorSetupFields";
import { disableSetupBlocksUsingSamePinNumbers } from "./actions/disable/disableSetupBlocksUsingSamePinNumbers";
import { disableSetupBlockWithMultiplePinOutsSamePins } from "./actions/disable/disableSetupBlockWithMultiplePinOutsSamePins";
import { disableDuplicateSetupBlocks } from "./actions/disable/disableDuplicateSetupBlock";
import { disableBlockThatRequiredToBeInArduinoLoopSetupOrFunction } from "./actions/disable/disableBlockThatRequiredToBeInArduinoLoopSetupOrFunction";
import { disableDuplicatePinBlocks } from "./actions/disable/disableDuplicatePinBlocks";
import { updater } from "./updater";
import { disableSensorReadBlocksWithWrongPins } from "./actions/disable/disableSensorReadBlocksWithWrongPins";
import { disableBlocksThatNeedASetupBlock } from "./actions/disable/disableBlocksThatNeedASetupBlock";
import { ActionType, DisableBlock, EnableBlock } from "./actions/actions";
import { eventToFrameFactory } from "../frames/event-to-frame.factory";
import type { ArduinoFrameContainer } from "../frames/arduino.frame";
import type { MicroControllerType } from "../microcontroller/microcontroller";
import { getBoardType } from "./helpers/get-board.helper";
import { disableBlocksWithInvalidPinNumbers } from "./actions/disable/disableBlocksWithInvalidPinNumbers";
import type { Settings } from "../../stores/settings.store";
import settingStore from "../../stores/settings.store";

// This is the current frame list
// We use this diff the new frame list so that we only update when things change
let currentFrameContainter: ArduinoFrameContainer = undefined;

let settings: Settings = undefined;

settingStore.subscribe((newSettings) => {
  settings = newSettings;
});

const registerEvents = (workspace: WorkspaceSvg) => {
  workspace.addChangeListener(async (blocklyEvent) => {
    console.log(blocklyEvent, "blockly event");
    if (
      blocklyEvent.element === "disabled" ||
      // Means a modal is opening
      blocklyEvent.element === "warningOpen" ||
      // Does not have anything to do with a block
      blocklyEvent.blockId === null ||
      blocklyEvent.element === "click" ||
      blocklyEvent.element === "selected"
    ) {
      return;
    }
    const microControllerType = getBoardType() as MicroControllerType;
    const event = transformEvent(
      getAllBlocks(),
      getAllVariables(),
      blocklyEvent,
      microControllerType
    );
    const firstActionPass = [
      ...disableBlocksWithInvalidPinNumbers(event),
      ...disableSetupBlocksUsingSamePinNumbers(event),
      ...disableSetupBlockWithMultiplePinOutsSamePins(event),
      ...disableDuplicateSetupBlocks(event),
      ...disableBlockThatRequiredToBeInArduinoLoopSetupOrFunction(event),
      ...disableDuplicatePinBlocks(event),

      ...disableSensorReadBlocksWithWrongPins(event),
      ...disableBlocksThatNeedASetupBlock(event),
    ];

    firstActionPass.forEach((a) => updater(a));
    enableBlocks(
      firstActionPass.filter(
        (a) => a.type === ActionType.DISABLE_BLOCK
      ) as DisableBlock[]
    );

    if (firstActionPass.filter((a) => a.stopCompiling).length >= 1) {
      currentFrameContainter = {
        error: true,
        frames: [],
        board: event.microController,
        settings,
      };
      frameStore.set(currentFrameContainter);
      codeStore.resetCode(microControllerType);
      return;
    }

    const secondActionPass = [
      ...deleteUnusedVariables(event),
      ...saveSensorSetupBlockData(event),
      ...updateSensorSetupFields(event),
      ...updateForLoopText(event),
      ...updateLoopNumberInSensorSetupBlock(event),
    ];

    secondActionPass.forEach((a) => updater(a));

    // We need this because we save the sensor setup data to the
    // block.
    const refreshEvent = transformEvent(
      getAllBlocks(),
      getAllVariables(),
      blocklyEvent,
      microControllerType
    );

    const newFrameContainer = eventToFrameFactory(refreshEvent, settings);
    console.log("new frames", newFrameContainer);

    if (!_.isEqual(newFrameContainer, currentFrameContainter)) {
      currentFrameContainter = newFrameContainer;
      console.log(refreshEvent, "arduinoStateEvent");
      frameStore.set(currentFrameContainter);
    }
    codeStore.set({ code: getArduinoCode(), boardType: microControllerType });
  });
};

const enableBlocks = (actions: DisableBlock[]) => {
  const disabledBlockIds = actions
    .filter((d) => d.type === ActionType.DISABLE_BLOCK)
    .map((a: DisableBlock) => a.blockId);

  const enableActions: EnableBlock[] = getAllBlocks()
    .map(transformBlock)
    .filter((b) => !disabledBlockIds.includes(b.id))
    .map((b) => {
      return {
        type: ActionType.ENABLE_BLOCK,
        blockId: b.id,
      };
    });

  enableActions.forEach((a) => updater(a));
};
export default _.debounce(registerEvents, 50);
