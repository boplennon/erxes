export const buildRecordAction = () => ({
  action: "record",
  format: "mp3",
});

export const buildConnectAction = (args: {
  fromType: "internal" | "external";
  fromNumber: string;
  fromAlias: string;
  toType: "internal" | "external";
  toNumber: string;
  toAlias: string;
  customData?: any;
  timeout?: number;
  record?: boolean;
  continueOnFail?: boolean;
  event_url?: string;
}) => {
  const {
    fromType,
    fromNumber,
    fromAlias,
    toType,
    toNumber,
    toAlias,
    customData,
    timeout = 30,
    record = true,
    continueOnFail = false,
    event_url,
  } = args;
  const action: any = {
    action: "connect",
    from: { type: fromType, number: fromNumber, alias: fromAlias },
    to: { type: toType, number: toNumber, alias: toAlias },
    timeout,
    record,
    continueOnFail,
  };
  if (customData) action.customData = JSON.stringify(customData);
  if (event_url) action.event_url = event_url;
  return action;
};


