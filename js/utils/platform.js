(function(ionic) {

  ionic.Platform = {

    isReady: false,
    isFullScreen: false,
    platforms: null,
    grade: null,

    ready: function(cb) {
      // run through tasks to complete now that the device is ready
      if(this.isReady) {
        cb();
      } else {
        // the platform isn't ready yet, add it to this array
        // which will be called once the platform is ready
        readyCallbacks.push(cb);
      }
    },

    detect: function() {
      var i, bodyClass = document.body.className;

      ionic.Platform._checkPlatforms();

      // only change the body class if we got platform info
      for(i = 0; i < this.platforms.length; i++) {
        bodyClass += ' platform-' + this.platforms[i];
      }

      bodyClass += ' grade-' + this.grade;

      document.body.className = bodyClass.trim();
    },

    device: function() {
      if(window.device) return window.device;
      if(this.isCordova()) console.error('device plugin required');
      return {};
    },

    _checkPlatforms: function(platforms) {
      this.platforms = [];
      this.grade = 'a';

      var v = this.version().toString();
      if(v.indexOf('.') > 0) {
        v = v.replace('.', '_');
      } else {
        v += '_0';
      }

      if(this.isCordova()) {
        this.platforms.push('cordova');
      }
      if(this.isIOS()) {
        this.platforms.push('ios');
        this.platforms.push('ios' + v.split('_')[0]);
        this.platforms.push('ios' + v);
      }
      if(this.isIPad()) {
        this.platforms.push('ipad');
      }
      if(this.isAndroid()) {
        this.platforms.push('android');
        this.platforms.push('android' + v.split('_')[0]);
        this.platforms.push('android' + v);

        if(platformVersion > 0 && platformVersion < 4.4) {
          this.grade = (platformVersion < 4 ? 'c' : 'b');
        }
      }
    },

    // Check if we are running in Cordova
    isCordova: function() {
      return !(!window.cordova && !window.PhoneGap && !window.phonegap);
    },
    isIPad: function() {
      return navigator.userAgent.toLowerCase().indexOf('ipad') >= 0;
    },
    isIOS: function() {
      return this.is('ios');
    },
    isAndroid: function() {
      return this.is('android');
    },

    platform: function() {
      // singleton to get the platform name
      if(!platformName) this.setPlatform(this.device().platform);
      return platformName;
    },

    setPlatform: function(n) {
      platformName = n;
    },

    version: function() {
      // singleton to get the platform version
      if(!platformVersion) this.setVersion(this.device().version);
      return platformVersion;
    },

    setVersion: function(v) {
      if(v) {
        v = v.split('.');
        platformVersion = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
      } else {
        platformVersion = 0;
      }
    },

    // Check if the platform is the one detected by cordova
    is: function(type) {
      type = type.toLowerCase();
      // check if it has an array of platforms
      if(this.platforms) {
        for(var x = 0; x < this.platforms.length; x++) {
          if(this.platforms[x] === type) return true;
        }
      }
      // exact match
      var pName = this.platform();
      if(pName) {
        return pName.toLowerCase() === type;
      }

      // A quick hack for to check userAgent
      return navigator.userAgent.toLowerCase().indexOf(type) >= 0;
    },

    exitApp: function() {
      this.ready(function(){
        navigator.app && navigator.app.exitApp && navigator.app.exitApp();
      });
    },

    showStatusBar: function(val) {
      // Only useful when run within cordova
      this.showStatusBar = val;
      this.ready(function(){
        // run this only when or if the platform (cordova) is ready
        if(ionic.Platform.showStatusBar) {
          // they do not want it to be full screen
          StatusBar.show();
          document.body.classList.remove('status-bar-hide');
        } else {
          // it should be full screen
          StatusBar.hide();
          document.body.classList.add('status-bar-hide');
        }
      });
    },

    fullScreen: function(showFullScreen, showStatusBar) {
      // fullScreen( [showFullScreen[, showStatusBar] ] )
      // showFullScreen: default is true if no param provided
      this.isFullScreen = (showFullScreen !== false);

      // add/remove the fullscreen classname to the body
      ionic.DomUtil.ready(function(){
        // run this only when or if the DOM is ready
        if(ionic.Platform.isFullScreen) {
          document.body.classList.add('fullscreen');
        } else {
          document.body.classList.remove('fullscreen');
        }
      });

      // showStatusBar: default is false if no param provided
      this.showStatusBar( (showStatusBar === true) );
    }

  };

  var platformName, // just the name, like iOS or Android
  platformVersion, // a float of the major and minor, like 7.1
  readyCallbacks = [];

  // setup listeners to know when the device is ready to go
  function onWindowLoad() {
    if(ionic.Platform.isCordova()) {
      // the window and scripts are fully loaded, and a cordova/phonegap 
      // object exists then let's listen for the deviceready
      document.addEventListener("deviceready", onPlatformReady, false);
    } else {
      // the window and scripts are fully loaded, but the window object doesn't have the
      // cordova/phonegap object, so its just a browser, not a webview wrapped w/ cordova
      onPlatformReady();
    }
    window.removeEventListener("load", onWindowLoad, false);
  }
  window.addEventListener("load", onWindowLoad, false);

  function onPlatformReady() {
    // the device is all set to go, init our own stuff then fire off our event
    ionic.Platform.isReady = true;
    ionic.Platform.detect();
    for(var x=0; x<readyCallbacks.length; x++) {
      // fire off all the callbacks that were added before the platform was ready
      readyCallbacks[x]();
    }
    readyCallbacks = [];
    ionic.trigger('platformready', { target: document });
    document.removeEventListener("deviceready", onPlatformReady, false);
  }

})(window.ionic);
