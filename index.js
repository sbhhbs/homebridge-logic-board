"use strict";

var inherits = require('util').inherits;
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;


  Characteristic.LogicBoardVarName = function() {
    Characteristic.call(this, 'LogicBoard Variable Name', '00000052-0000-1000-8000-1026BB765291');
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ]
    });
    this.value = this.getDefaultValue();
  };
  inherits(Characteristic.LogicBoardVarName, Characteristic);
  Characteristic.LogicBoardVarName.UUID = '00000052-0000-1000-8000-1026BB765291';


  homebridge.registerAccessory("homebridge-logic-board", "LogicBoard", LogicBoard);
};


class LogicBoard {
  constructor(log, config) {
    this.log = log;
    this.name = config.name || "LogicBoard";
    this.config = config;

    this.inputSwitchServices = [];
    this.outputOccupancyServices = [];
    
    this.evalStr = config.eval;

    for (var i = 0; i < config.inputs.length; i++) {
      var one = config.inputs[i];
      var sw = this._createSwitch(one["varName"], one["displayName"], i + 1);
      this.inputSwitchServices.push(sw);
    }

    for (var i = 0; i < config.outputs.length; i++) {
      var one = config.outputs[i];
      var sw = this._createSensor(one["varName"], one["displayName"], i + 1);
      this.outputOccupancyServices.push(sw);
    }
    this.refreshAllStatus();
  }

  refreshAllStatus() {
    var remainingStatus = this.inputSwitchServices.length;
    var varMap = {};
    var resultMap = {};

    var evalueate_all = () => {
      var keys = [];
      var wholeEvalStr = '';
      for (var key in varMap) {
        if (varMap.hasOwnProperty(key)) {
          keys.push(key);

          var evalStr = 'var ' + key + ' = ' + varMap[key] + ';';
          wholeEvalStr = wholeEvalStr + evalStr;
        }
      }
      for (var i = 0; i < this.config.outputs.length; i++) {
        var one = this.config.outputs[i];
        var evalStr = 'var ' + one["varName"] + ' = ' + 'false' + ';';
        wholeEvalStr = wholeEvalStr + evalStr;
      }


      wholeEvalStr +=  this.evalStr;
      this.log("evalStr: ", wholeEvalStr);
      eval.call(null, wholeEvalStr);

      for (var i = 0; i < this.config.outputs.length; i++) {
        var one = this.config.outputs[i];
        var result = eval.call(null, one["varName"]);
        this.log(one["varName"] + 'evaluates to: ' + result);
        resultMap[one["varName"]] = result;
      }

      for (var i = 0; i < this.outputOccupancyServices.length; i++) {
        var occupancyService = this.outputOccupancyServices[i];
        
        occupancyService.getCharacteristic(Characteristic.LogicBoardVarName)
        .getValue(function(err, value3) {
          if (!err) {
            var result = resultMap[value3];
            if (result) {
              occupancyService.setCharacteristic(Characteristic.OccupancyDetected, Characteristic.OccupancyDetected.OCCUPANCY_DETECTED);
            }
            else {
              occupancyService.setCharacteristic(Characteristic.OccupancyDetected, Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
            }
          }
        });
      }
    };

    var set_value = (sw, value) => {
      sw.getCharacteristic(Characteristic.LogicBoardVarName)
      .getValue(function(err, value2) {
        if (!err) {
          varMap[value2] = value;
          remainingStatus -= 1;
          if (!remainingStatus) {
            evalueate_all();
          }
        }
      });
    };


    for (var i = 0; i < this.inputSwitchServices.length; i++) {
      var sw = this.inputSwitchServices[i];
      sw.getCharacteristic(Characteristic.On)
      .getValue(function(err, value) {
        if (!err) {
          set_value(sw, value);
        }
      });
    }
  }


  _createSwitch(varName, displayName, index) {
    this.log('Create Switch: ' + displayName + ' for var: ' + varName);
    var sw = new Service.Switch(displayName, index);
    sw.setCharacteristic(Characteristic.On, false);
    sw.getCharacteristic(Characteristic.On).on('change', this.refreshAllStatus.bind(this));

    sw.addCharacteristic(Characteristic.LogicBoardVarName);
    sw.setCharacteristic(Characteristic.LogicBoardVarName, varName);

    return sw;
  }

  _createSensor(varName, displayName, index) {
    this.log('Create Sensor: ' + displayName + ' for var: ' + varName);
    var sw = new Service.OccupancySensor(displayName, index);
    sw.setCharacteristic(Characteristic.OccupancyDetected, Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
    
    sw.addCharacteristic(Characteristic.LogicBoardVarName);
    sw.setCharacteristic(Characteristic.LogicBoardVarName, varName);
    return sw;
  }



  getServices() {
    var informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'github.com/sbhhbs')
        .setCharacteristic(Characteristic.Model, '0.0.1')
        .setCharacteristic(Characteristic.SerialNumber, '20171108001');

    return [informationService, ...this.inputSwitchServices, ...this.outputOccupancyServices]
  }
}

