// Type cho customData (sau khi JSON.parse)
interface CustomData {
    _id: string;
    state: string;
    createdAt: string;
    modifiedAt: string;
    sex: number;
    emails: string[];
    emailValidationStatus: string;
    primaryPhone: string;
    phones: string[];
    addresses: string[];
    phoneValidationStatus: string;
    profileScore: number;
    status: string;
    hasAuthority: string;
    doNotDisturb: string;
    isSubscribed: string;
    relatedIntegrationIds: string[];
    integrationId: string;
    tagIds: string[];
    mergedIds: string[];
    customFieldsData: any[];
    deviceTokens: string[];
    searchText: string;
    scopeBrandIds: string[];
    trackedData: any[];
    __v: number;
    ownerId: string;
    firstName: string;
    customFieldsDataByFieldCode: Record<string, any>;
  }
  
  // Type cho số điện thoại (from/to)
  interface CallParty {
    number: string;
    alias: string;
    is_online: boolean;
    type: 'external' | 'internal';
  }
  
  // Type chính cho event
  export interface StringeeCallEvent {
    endCallCause: string; // ví dụ 'USER_END_CALL'
    actorType: string;
    original: boolean;
    isVideoCall: boolean;
    peerToPeer: boolean;
    timestamp_ms: number;
    customData: string; // nếu muốn parse thì dùng CustomData
    endedBy: string; // ví dụ 'EXTERNAL'
    type: string; // ví dụ 'stringee_call'
    callType: string; // ví dụ 'CALL'
    call_id: string;
    actor: string;
    duration: number;
    callCreatedReason: string;
    call_status: string; // ví dụ 'ended'
    event_id: string;
    project_id: number;
    serial: number;
    answerDuration: number;
    account_sid: string;
    from: CallParty;
    to: CallParty;
  }