import { INTEGRATION_KINDS } from "../constants";
import { removeCountryCodeFromPhoneNumber } from "../helpers";

export const getIntegrationByToNumber = async (models: any, to: string) => {
  const toNumber = removeCountryCodeFromPhoneNumber(to);
  const integration = await models.Integrations.findOne({
    $and: [
      { callCenterPhoneNumbers: { $in: [toNumber] } },
      { kind: INTEGRATION_KINDS.MESSENGER },
    ],
  });
  return integration;
};


