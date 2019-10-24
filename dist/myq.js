'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
var axios = require('axios');

var constants = require('./constants');

var ErrorHandler = function ErrorHandler() {
  _classCallCheck(this, ErrorHandler);
};

;
ErrorHandler.prototype.returnError = function (returnCode, err) {
  var result = {
    returnCode: returnCode,
    message: constants.errorMessages[returnCode]
  };
  if (err) {
    result.unhandledError = err;
  }
  return result;
};
ErrorHandler.prototype.handleBadResponse = function (response) {
  // TODO: Handle these granularly.
  return undefined.prototype.returnError(11);
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
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var _this = this;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!this.username || !this.password)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', Promise.resolve(ErrorHandler.prototype.returnError(14)));

              case 2:
                return _context.abrupt('return', Promise.resolve(this.executeRequest(constants.routes.login, 'post', null, {
                  Username: this.username,
                  Password: this.password
                }).then(function (response) {
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
                    case 203:
                      return ErrorHandler.prototype.returnError(14);
                    case 205:
                      return ErrorHandler.prototype.returnError(16);
                    case 207:
                      return ErrorHandler.prototype.returnError(17);
                    default:
                      return ErrorHandler.prototype.returnError(11);
                  }
                }).catch(function (err) {
                  if (err.statusCode === 500) {
                    return ErrorHandler.prototype.returnError(14);
                  }

                  return ErrorHandler.prototype.returnError(11, err);
                })));

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function login() {
        return _ref.apply(this, arguments);
      }

      return login;
    }()
  }, {
    key: 'executeRequest',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(route, method, params, data) {
        var isLoginRequest, headers, config;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                isLoginRequest = route === constants.routes.login;
                headers = {
                  "Content-Type": "application/json",
                  "MyQApplicationId": constants.appId,
                  "User-Agent": constants.userAgent
                };

                // If there's not a security token, and we're not logging in, throw an error.

                if (!(!isLoginRequest && !this.securityToken)) {
                  _context2.next = 6;
                  break;
                }

                return _context2.abrupt('return', Promise.resolve(ErrorHandler.prototype.returnError(13)));

              case 6:
                if (!isLoginRequest) {
                  // Add our security token to the headers.
                  headers.SecurityToken = this.securityToken;
                }

              case 7:
                config = {
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

                return _context2.abrupt('return', Promise.resolve(axios(config).then(function (response) {
                  if (response.status !== 200) {
                    return ErrorHandler.prototype.handleBadResponse(response);
                  }
                  return response;
                })));

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function executeRequest(_x, _x2, _x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return executeRequest;
    }()
  }, {
    key: 'getAccountInfo',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var _this2 = this;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', this.executeRequest(constants.routes.account, 'get', { expand: 'account' }).then(function (_ref4) {
                  var data = _ref4.data;

                  if (!data || !data.Account || !data.Account.Id) {
                    return ErrorHandler.prototype.returnError(11);
                  }
                  _this2.accountId = data.Account.Id;
                }).catch(function (error) {
                  return ErrorHandler.prototype.returnError(11, error);
                }));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function getAccountInfo() {
        return _ref3.apply(this, arguments);
      }

      return getAccountInfo;
    }()
  }, {
    key: 'getDevices',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(deviceTypeParams) {
        var _this3 = this;

        var promise, deviceTypes, deviceType;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(deviceTypeParams === null)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt('return', Promise.resolve(ErrorHandler.prototype.returnError(15)));

              case 2:
                promise = Promise.resolve(function () {
                  return null;
                });

                if (!this.accountId) {
                  promise = Promise.resolve(this.getAccountInfo());
                }

                deviceTypes = !deviceTypeParams ? [] : Array.isArray(deviceTypeParams) ? deviceTypeParams : [deviceTypeParams];

                // TODO: Validate device types when we have a more complete list.

                for (deviceType in deviceTypes) {
                  if (!constants.allDeviceTypes.includes(deviceType)) {
                    // return ErrorHandler.prototype.returnError(15);
                  }
                }

                return _context4.abrupt('return', promise.then(function () {
                  return _this3.executeRequest('' + constants.routes.getDevices.replace('{accountId}', _this3.accountId), 'get');
                }).then(function (response) {
                  var data = response.data;

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
                }).catch(function (err) {
                  return ErrorHandler.prototype.returnError(11, err);
                }));

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getDevices(_x5) {
        return _ref5.apply(this, arguments);
      }

      return getDevices;
    }()
  }, {
    key: 'getDeviceState',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(serialNumber, attributeName) {
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt('return', this.getDevices().then(function (response) {
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
                }).catch(function (err) {
                  if (err.statusCode === 400) {
                    return ErrorHandler.prototype.returnError(15);
                  }

                  return ErrorHandler.prototype.returnError(11, err);
                }));

              case 1:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function getDeviceState(_x6, _x7) {
        return _ref6.apply(this, arguments);
      }

      return getDeviceState;
    }()
  }, {
    key: 'getDoorState',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(serialNumber) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt('return', this.getDeviceState(serialNumber, 'doorState').then(function (result) {
                  if (result.returnCode !== 0) {
                    return result;
                  }

                  var newResult = JSON.parse(JSON.stringify(result));
                  newResult.doorState = newResult.state;
                  delete newResult.state;
                  return newResult;
                }).catch(function (err) {
                  return ErrorHandler.prototype.returnError(11, err);
                }));

              case 1:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getDoorState(_x8) {
        return _ref7.apply(this, arguments);
      }

      return getDoorState;
    }()
  }, {
    key: 'getLightState',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(serialNumber) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt('return', this.getDeviceState(serialNumber, 'lightState').then(function (result) {
                  if (result.returnCode !== 0) {
                    return result;
                  }

                  var newResult = JSON.parse(JSON.stringify(result));
                  newResult.lightState = newResult.state;
                  delete newResult.state;
                  return newResult;
                }).catch(function (err) {
                  return ErrorHandler.prototype.returnError(11, err);
                }));

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getLightState(_x9) {
        return _ref8.apply(this, arguments);
      }

      return getLightState;
    }()
  }, {
    key: 'setDeviceState',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(serialNumber, action) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', this.executeRequest('' + constants.routes.setDevice.replace('{accountId}', this.accountId).replace('{serialNumber}', serialNumber), 'put', null, { action_type: action }).then(function (response) {
                  console.log(response);
                  if (!response || !response.data) {
                    return ErrorHandler.prototype.returnError(12);
                  }

                  var data = response.data;


                  if (data.ReturnCode === '-3333') {
                    return ErrorHandler.prototype.returnError(13);
                  } else if (!data.ReturnCode) {
                    return ErrorHandler.prototype.returnError(11);
                  }

                  var result = {
                    returnCode: 0
                  };
                  return result;
                }).catch(function (err) {
                  if (err.statusCode === 500) {
                    return ErrorHandler.prototype.returnError(15);
                  }

                  return ErrorHandler.prototype.returnError(11, err);
                }));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function setDeviceState(_x10, _x11) {
        return _ref9.apply(this, arguments);
      }

      return setDeviceState;
    }()
  }, {
    key: 'setDoorState',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(serialNumber, action) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', this.setDeviceState(serialNumber, action).then(function (result) {
                  return result;
                }));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function setDoorState(_x12, _x13) {
        return _ref10.apply(this, arguments);
      }

      return setDoorState;
    }()
  }, {
    key: 'setLightState',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(serialNumber, action) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt('return', this.setDeviceState(serialNumber, action).then(function (result) {
                  return result;
                }));

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function setLightState(_x14, _x15) {
        return _ref11.apply(this, arguments);
      }

      return setLightState;
    }()
  }]);

  return MyQ;
}();

module.exports = MyQ;