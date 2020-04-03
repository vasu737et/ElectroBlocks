import { ValueGenerator } from '../../value.factories';
import { findComponent } from '../../factory.helpers';
import { PinState } from '../../../state/arduino-components.state';
import { PinSensor } from '../../../../blockly/state/sensors.state';
import { ArduinoComponentType } from '../../../state/arduino.state';
import { findFieldValue } from '../../../../blockly/helpers/block-data.helper';

export const getPinState = (setupBlockType: string): ValueGenerator => {
  return (blocks, block, variables, timeline, previousState) => {
    return findComponent<PinState>(
      previousState,
      ArduinoComponentType.PIN,
      findFieldValue(block, 'PIN')
    ).state;
  };
};
