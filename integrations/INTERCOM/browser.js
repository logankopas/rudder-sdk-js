import logger from "../../utils/logUtil";

class INTERCOM {
  constructor(config) {
    this.NAME = "INTERCOM";
    this.API_KEY = config.apiKey;
    this.APP_ID = config.appId;
    this.MOBILE_APP_ID = config.mobileAppId;
    logger.debug("Config ", config);
  }

  init() {
    window.intercomSettings = {
      app_id: this.APP_ID
    };

    (function() {
      var w = window;
      var ic = w.Intercom;
      if (typeof ic === "function") {
        ic("reattach_activator");
        ic("update", w.intercomSettings);
      } else {
        var d = document;
        var i = function() {
          i.c(arguments);
        };
        i.q = [];
        i.c = function(args) {
          i.q.push(args);
        };
        w.Intercom = i;
        var l = function() {
          var s = d.createElement("script");
          s.type = "text/javascript";
          s.async = true;
          s.src =
            "https://widget.intercom.io/widget/" +
            window.intercomSettings.app_id;
          var x = d.getElementsByTagName("script")[0];
          x.parentNode.insertBefore(s, x);
        };
        if (document.readyState === "complete") {
          l();
          window.intercom_code = true;
        } else if (w.attachEvent) {
          w.attachEvent("onload", l);
          window.intercom_code = true;
        } else {
          w.addEventListener("load", l, false);
          window.intercom_code = true;
        }
      }
    })();
  }

  page() {
    // Get new messages of the current user
    window.Intercom("update");
  }

  identify(rudderElement) {
    let rawPayload = {};
    const context = rudderElement.message.context;

    const identityVerificationProps = context.Intercom
      ? context.Intercom
      : null;
    if (identityVerificationProps != null) {
      // user hash
      const userHash = context.Intercom.user_hash
        ? context.Intercom.user_hash
        : null;

      if (userHash != null) {
        rawPayload.user_hash = userHash;
      }

      // hide default launcher
      const hideDefaultLauncher = context.Intercom.hideDefaultLauncher
        ? context.Intercom.hideDefaultLauncher
        : null;

      if (hideDefaultLauncher != null) {
        rawPayload.hide_default_launcher = hideDefaultLauncher;
      }
    }

    // map rudderPayload to desired
    Object.keys(context.traits).forEach(field => {
      const value = context.traits[field];

      if (field === "company") {
        let companies = [];
        let company = {};
        const companyFields = Object.keys(context.traits[field]);

        companyFields.forEach(key => {
          if (key != "id") {
            company[key] = context.traits[field][key];
          } else {
            company["company_id"] = context.traits[field][key];
          }
        });

        if (!companyFields.includes("id")) {
          company["company_id"] = md5(company.name);
        }

        companies.push(company);
        rawPayload.companies = companies;
      } else {
        rawPayload[field] = context.traits[field];
      }

      switch (field) {
        case "createdAt":
          rawPayload["created_at"] = value;
          break;
        case "anonymousId":
          rawPayload["user_id"] = value;
          break;

        default:
          break;
      }
    });
    rawPayload.user_id = rudderElement.message.userId;
    window.Intercom("update", rawPayload);
  }

  track(rudderElement) {
    let rawPayload = {};
    const message = rudderElement.message;

    const properties = message.properties
      ? Object.keys(message.properties)
      : null;
    properties.forEach(property => {
      const value = message.properties[property];
      rawPayload[property] = value;
    });

    if (message.event) {
      rawPayload.event_name = message.event;
    }
    rawPayload.user_id = message.userId ? message.userId : message.anonymousId;
    rawPayload.created_at = Math.floor(
      new Date(message.originalTimestamp).getTime() / 1000
    );
    window.Intercom("trackEvent", rawPayload.event_name, rawPayload);
  }

  isLoaded() {
    return !!window.intercom_code;
  }

  isReady() {
    return !!window.intercom_code;
  }
}

export { INTERCOM };
