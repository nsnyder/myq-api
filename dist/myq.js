'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
var axios = require('axios');

var constants = require('./constants');

var ErrorHandler = function ErrorHandler() {
  _classCallCheck(this, ErrorHandler);
};

;
ErrorHandler.prototype.returnError = function (returnCode, error, response) {
  var result = {
    returnCode: returnCode,
    message: constants.errorMessages[returnCode],
    providerMessage: null,
    unhandledError: null
  };
  if (response && response.description) {
    result.providerMessage = response.description;
  }
  if (error) {
    result.unhandledError = error;
  }
  return Promise.resolve(result);
};
ErrorHandler.prototype.parseBadResponse = function (response) {
  console.log(response);
  if (!response) {
    return errorhandler.prototype.returnerror(12, null, response);
  }

  var data = response.data,
      status = response.status;

  if (!status) {
    return errorhandler.prototype.returnerror(12, null, data);
  }
  if (status === 500) {
    return errorhandler.prototype.returnerror(15);
  }
  if ([400, 401].includes(status)) {
    if (data.code === '401.205') {
      return errorhandler.prototype.returnerror(16, null, data);
    }
    if (data.code === '401.207') {
      return errorhandler.prototype.returnerror(17, null, data);
    }
    return errorhandler.prototype.returnerror(14, null, data);
  }
  if (status === 404) {
    if (data.code === '404.401') {
      return errorhandler.prototype.returnerror(18, null, data);
    }
    return errorhandler.prototype.returnerror(20);
  }

  return errorhandler.prototype.returnerror(11, null, data);
};

var MyQ = function () {
  // Build the object and initialize any properties we're going to use.
  function MyQ(username, password) {
    _classCallCheck(this, MyQ);

    this.accountId = null;
    this.username = username;
    this.password = password;
    this.securityToken = null;
  }

  _createClass(MyQ, [{
    key: 'login',
    value: function login() {
      var _this = this;

      if (!this.username || !this.password) {
        return ErrorHandler.prototype.returnError(14);
      }

      return Promise.resolve(this.executeRequest(constants.routes.login, 'post', null, {
        Username: this.username,
        Password: this.password
      }).then(function (originalResponse) {
        var response = originalResponse.response,
            returnCode = originalResponse.returnCode;

        if (returnCode !== 0) {
          throw originalResponse;
        }
        if (!response || !response.data) {
          return ErrorHandler.prototype.returnError(12);
        }

        var data = response.data;

        switch (response.status) {
          case 200:
            var token = data.SecurityToken;
            if (!token) {
              return ErrorHandler.prototype.returnError(11);
            }

            _this.securityToken = token;
            return {
              returnCode: 0,
              token: data.SecurityToken
            };
          default:
            throw originalResponse;
        }
      }).catch(function (_ref) {
        var response = _ref.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      }));
    }
  }, {
    key: 'checkIsLoggedIn',
    value: function checkIsLoggedIn() {
      return !!this.securityToken;
    }
  }, {
    key: 'executeRequest',
    value: function executeRequest(route, method, params, data) {
      var isLoginRequest = route === constants.routes.login;
      var headers = {
        "Content-Type": "application/json",
        "MyQApplicationId": constants.appId
      };

      // If we aren't logged in or logging in, throw an error.
      if (!isLoginRequest && !this.checkIsLoggedIn()) {
        return ErrorHandler.prototype.returnError(13);
      } else if (!isLoginRequest) {
        // Add our security token to the headers.
        headers.SecurityToken = this.securityToken;
      }
      var config = {
        method: method,
        url: constants.endpointBase + '/' + route,
        headers: headers
      };
      if (!!data) {
        config.data = data;
      }
      if (!!params) {
        config.params = params;
      }

      return Promise.resolve(axios(config)).then(function (response) {
        return {
          returnCode: 0,
          response: response
        };
      });
    }
  }, {
    key: 'getAccountInfo',
    value: function getAccountInfo() {
      var _this2 = this;

      return this.executeRequest(constants.routes.account, 'get', { expand: 'account' }).then(function (returnValue) {
        if (returnValue.returnCode !== 0 && typeof returnValue.returnCode !== 'undefined') {
          return returnValue;
        }
        var data = returnValue.response.data;

        if (!data || !data.Account || !data.Account.Id) {
          return ErrorHandler.prototype.returnError(11);
        }
        _this2.accountId = data.Account.Id;
      }).catch(function (_ref2) {
        var response = _ref2.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'getDevices',
    value: function getDevices(deviceTypeParams) {
      var _this3 = this;

      var promise = Promise.resolve(function () {
        return null;
      });
      if (!this.accountId) {
        promise = Promise.resolve(this.getAccountInfo());
      }

      var deviceTypes = !deviceTypeParams ? [] : Array.isArray(deviceTypeParams) ? deviceTypeParams : [deviceTypeParams];

      // TODO: Validate device types when we have a more complete list.
      for (var deviceType in deviceTypes) {
        if (!constants.allDeviceTypes.includes(deviceType)) {
          // return ErrorHandler.prototype.returnError(15);
        }
      }

      return promise.then(function () {
        return _this3.executeRequest('' + constants.routes.getDevices.replace('{accountId}', _this3.accountId), 'get');
      }).then(function (returnValue) {
        if (returnValue.returnCode !== 0 && typeof returnValue.returnCode !== 'undefined') {
          return returnValue;
        }

        var _returnValue$response = returnValue.response,
            data = _returnValue$response.data,
            status = _returnValue$response.status;

        if (![200, 204].includes(status)) {
          return ErrorHandler.prototype.parseBadResponse(returnValue.response);
        }

        var devices = data.items;
        if (!devices) {
          return ErrorHandler.prototype.returnError(11);
        }

        if (deviceTypes.length) {
          devices = devices.filter(function (device) {
            return deviceTypes.includes(device.device_type);
          });
        }

        var result = {
          returnCode: 0
        };

        var modifiedDevices = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = devices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var device = _step.value;

            var modifiedDevice = {
              family: device.device_family,
              name: device.name,
              type: device.device_type,
              serialNumber: device.serial_number
            };

            var state = device.state;
            if (constants.myQProperties.online in state) {
              modifiedDevice.online = state[constants.myQProperties.online];
            }
            if (constants.myQProperties.doorState in state) {
              modifiedDevice.doorState = state[constants.myQProperties.doorState];
              var date = new Date(state[constants.myQProperties.lastUpdate]);
              modifiedDevice.doorStateUpdated = date.toLocaleString();
            }
            if (constants.myQProperties.lightState in state) {
              modifiedDevice.lightState = state[constants.myQProperties.lightState];
              var _date = new Date(state[constants.myQProperties.lastUpdate]);
              modifiedDevice.lightStateUpdated = _date.toLocaleString();
            }

            modifiedDevices.push(modifiedDevice);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        result.devices = modifiedDevices;
        return result;
      }).catch(function (_ref3) {
        var response = _ref3.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'getDeviceState',
    value: function getDeviceState(serialNumber, attributeName) {
      return this.getDevices().then(function (response) {
        var device = (response.devices || []).find(function (device) {
          return device.serialNumber === serialNumber;
        });
        if (!device) {
          return ErrorHandler.prototype.returnError(18);
        } else if (!(attributeName in device)) {
          return ErrorHandler.prototype.returnError(19);
        }

        var result = {
          returnCode: 0,
          state: device[attributeName]
        };
        return result;
      }).catch(function (_ref4) {
        var response = _ref4.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'getDoorState',
    value: function getDoorState(serialNumber) {
      return this.getDeviceState(serialNumber, 'doorState').then(function (result) {
        if (result.returnCode !== 0) {
          return result;
        }

        var newResult = JSON.parse(JSON.stringify(result));
        newResult.doorState = newResult.state;
        delete newResult.state;
        return newResult;
      }).catch(function (_ref5) {
        var response = _ref5.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'getLightState',
    value: function getLightState(serialNumber) {
      return this.getDeviceState(serialNumber, 'lightState').then(function (result) {
        if (result.returnCode !== 0) {
          return result;
        }

        var newResult = JSON.parse(JSON.stringify(result));
        newResult.lightState = newResult.state;
        delete newResult.state;
        return newResult;
      }).catch(function (_ref6) {
        var response = _ref6.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'setDeviceState',
    value: function setDeviceState(serialNumber, action) {
      var _this4 = this;

      var promise = Promise.resolve(function () {
        return null;
      });
      if (!this.accountId) {
        promise = Promise.resolve(this.getAccountInfo());
      }

      return promise.then(function () {
        return _this4.executeRequest('' + constants.routes.setDevice.replace('{accountId}', _this4.accountId).replace('{serialNumber}', serialNumber), 'put', null, { action_type: action });
      }).then(function (returnValue) {
        var returnCode = returnValue.returnCode,
            response = returnValue.response;

        if (returnCode !== 0 && typeof returnCode !== 'undefined') {
          return returnValue;
        }

        if ([200, 204].includes(response.status)) {
          return {
            returnCode: 0
          };
        }

        return ErrorHandler.prototype.parseBadResponse(response);
      }).catch(function (_ref7) {
        var response = _ref7.response;
        return ErrorHandler.prototype.parseBadResponse(response);
      });
    }
  }, {
    key: 'setDoorOpen',
    value: function setDoorOpen(serialNumber, shouldOpen) {
      var action = constants.doorCommands.close;
      if (shouldOpen) {
        action = constants.doorCommands.open;
      }
      return this.setDeviceState(serialNumber, action);
    }
  }, {
    key: 'setLightState',
    value: function setLightState(serialNumber, turnOn) {
      var action = constants.lightCommands.off;
      if (turnOn) {
        action = constants.lightCommands.on;
      }
      return this.setDeviceState(serialNumber, action);
    }
  }]);

  return MyQ;
}();

module.exports = MyQ;