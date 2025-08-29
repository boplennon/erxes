import React from "react";
import { getEnv } from "modules/common/utils";
import styled from "styled-components";
import { NameCard } from "@erxes/ui/src/components";

// Styled Components
const CallPanel = styled.div`
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: 340px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 1000;
`;



const AudioControls = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const AudioButton = styled.button<{ active?: boolean }>`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid ${props => props.active ? '#10b981' : '#d1d5db'};
  background: ${props => props.active ? '#10b981' : '#fff'};
  color: ${props => props.active ? '#fff' : '#374151'};
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#059669' : '#f9fafb'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CallTitle = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
`;

const CallInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const CallInfoRow = styled.div`
  margin-bottom: 2px;
`;

const CustomerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const Avatar = styled.div<{ src?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  background-image: ${(p) => (p.src ? `url(${p.src})` : 'none')};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const CallButton = styled.button<{ variant: 'answer' | 'reject' | 'hangup' }>`
  flex: 1;
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.9;
  }

  ${({ variant }) => {
    switch (variant) {
      case 'answer':
        return 'background: #10b981;';
      case 'reject':
        return 'background: #ef4444;';
      case 'hangup':
        return 'background: #f59e0b;';
      default:
        return 'background: #6b7280;';
    }
  }}
`;

interface IProps {
  userEmail: string;
}

type State = {
  callPanelVisible?: boolean;
  callFrom?: string;
  callTo?: string;
  callId?: string;
  callStatus?: string;
  isProcessing?: boolean;
  isConnected?: boolean;
  isMuted?: boolean;
  isSpeakerOn?: boolean;
  isOnHold?: boolean;
  customerInfo?: any;
};

class IncomingCall extends React.Component<IProps, State> {
  private stringeeClient: any | null = null;
  private stringeeCurrentCall: any | null = null;
  private incomingAudio: HTMLAudioElement | null = null;

  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (this.props.userEmail) {
      this.initializeStringee(this.props.userEmail).catch((e) => {
        // eslint-disable-next-line no-console
        console.error("[Stringee] init failed", e);
      });
    }
  }

  componentWillUnmount(): void {
    try {
      if (this.stringeeClient) {
        this.stringeeClient.disconnect();
      }
      if (this.incomingAudio) {
        this.incomingAudio.pause();
        this.incomingAudio.src = "";
        this.incomingAudio = null;
      }
    } catch (_e) {}
  }

  private loadStringeeSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const w = window as any;
      if (w.StringeeClient) {
        return resolve();
      }

      const script = document.createElement("script");
      script.src = "https://cdn.stringee.com/sdk/web/latest/stringee-web-sdk.min.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Stringee SDK"));
      document.head.appendChild(script);
    });
  };

  private async initializeStringee(userEmail: string): Promise<void> {
    await this.loadStringeeSdk();

    //Stringee doesnt regcognize userId contain @
    const token = await this.fetchStringeeToken(userEmail.replace("@", "_"));

    const w = window as any;
    const ClientCtor = w.StringeeClient;
    if (!ClientCtor) {
      throw new Error("StringeeClient is not available on window");
    }

    const STRINGEE_SERVER_ADDRS = [
      "wss://v1.stringee.com:6899/", 
      "wss://v2.stringee.com:6899/"
    ];

    this.stringeeClient = new ClientCtor(STRINGEE_SERVER_ADDRS);

    // Bind events
    this.stringeeClient.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("[Stringee] connected");
      this.setState({ isConnected: true });
    });

    this.stringeeClient.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log("[Stringee] disconnected");
      this.setState({ isConnected: false });
      this.resetCallState();
    });

    this.stringeeClient.on("authen", (res: any) => {
      // eslint-disable-next-line no-console
      console.log("[Stringee] authen", res);
      
      // Check multiple possible success indicators
      const isSuccess = res.r === true || 
                      res.r === 'SUCCESS' || 
                      res.message === 'SUCCESS' ||
                      res.status === 'SUCCESS' ||
                      (typeof res === 'string' && res === 'SUCCESS');
      
      if (isSuccess) {
        // eslint-disable-next-line no-console
        console.log("[Stringee] Authentication successful");
      } else {
        // eslint-disable-next-line no-console
        console.log("[Stringee] Authentication failed:", res.message || res.reason || res.status || 'Unknown error');
      }
    });

    this.stringeeClient.on("error", (res: any) => {
      // eslint-disable-next-line no-console
      console.log("[Stringee] error", res);
    });

    // Token refresh when access_token expires
    this.stringeeClient.on('requestnewtoken', async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('[Stringee] requestnewtoken - fetching new token');
        const refreshed = await this.fetchStringeeToken(userEmail.replace("@", "_"));
        this.stringeeClient && this.stringeeClient.connect(refreshed);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[Stringee] Failed to refresh token', e);
      }
    });


    // Also listen for 'incomingcall' for backward compatibility
    this.stringeeClient.on("incomingcall", (incomingcall: any) => {
      // eslint-disable-next-line no-console
      console.log("[Stringee] Raw incoming call object (legacy):", incomingcall);
      this.handleIncomingCall(incomingcall);
    });

    // Connect using the token
    this.stringeeClient.connect(token);
  }

  private async fetchStringeeToken(email: string): Promise<string> {
    try {
      const { REACT_APP_API_URL } = getEnv();
      const base = REACT_APP_API_URL || "";
      const url = `${base}/pl:stringee/stringee/generate-token`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data?.token) {
        throw new Error("Token missing in response");
      }
      return data.token as string;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("[Stringee] token fetch failed", e);
      throw e;
    }
  }

  private handleIncomingCall = (incomingcall: any) => {
    this.stringeeCurrentCall = incomingcall;
    
    // Set up call event listeners
    this.setupCallEvents(incomingcall);
    
    // Parse customer info from customData
    let parsedCustomer: any | undefined;
    console.log("incomingcall -->", incomingcall)
    const rawCustom = incomingcall.customDataFromYourServer || incomingcall.customData || incomingcall.custom;
    if (rawCustom && typeof rawCustom === 'string') {
      try {
        parsedCustomer = JSON.parse(rawCustom);
      } catch (_e) {
        // eslint-disable-next-line no-console
        console.log('[Stringee] Failed to parse customData');
      }
    }

    console.log("parsedCustomer -->", parsedCustomer)
    this.setState({
      callPanelVisible: true,
      callFrom: incomingcall.fromNumber || incomingcall.from,
      callTo: incomingcall.toAlias || incomingcall.to,
      callId: incomingcall.callId,
      callStatus: "Incoming",
      isProcessing: false,
      customerInfo: parsedCustomer,
    });
    // Play incoming ringtone until answered or ended
    try {
      if (!this.incomingAudio) {
        this.incomingAudio = new Audio("/sound/incoming.mp3");
        this.incomingAudio.loop = true;
      }
      this.incomingAudio.currentTime = 0;
      // Some browsers require user gesture; ignore play() errors
      this.incomingAudio.play().catch((_e) => {
        console.log("ERROR play -->", _e)
      });
    } catch (_e) {
      console.log("ERROR -->", _e)
    }
    
    // eslint-disable-next-line no-console
    console.log(`[Stringee] Call details: From ${incomingcall.fromNumber || incomingcall.from} to ${incomingcall.toNumber || incomingcall.to}`);
  };

  private setupCallEvents = (call: any) => {
    // Setup call events according to Stringee Call2 documentation
    call.on('signalingstate', (state: any) => {
      // eslint-disable-next-line no-console
      console.log('[Stringee] signalingstate', state);
      const description = state?.description || state?.reason || "";
      this.setState({ callStatus: description });
      
      if (state?.code === 6) {
        // eslint-disable-next-line no-console
        console.log('[Stringee] Call ended');
        this.setState({ callStatus: 'ended' });
        if (this.incomingAudio) this.incomingAudio.pause();
        this.resetCallState();
      } else if (state?.code === 3) {
        // eslint-disable-next-line no-console
        console.log('[Stringee] Call answered');
        this.setState({ callStatus: 'connected' });
        if (this.incomingAudio) this.incomingAudio.pause();
      } else if (state?.code === 5) {
        // eslint-disable-next-line no-console
        console.log('[Stringee] User busy');
        this.setState({ callStatus: 'busy' });
        if (this.incomingAudio) this.incomingAudio.pause();
        this.resetCallState();
      }
    });

    call.on('mediastate', (state: any) => {
      // eslint-disable-next-line no-console
      console.log('[Stringee] mediastate', state);
      
      if (state?.code === 1 && state?.reason === 'Connected') {
        // eslint-disable-next-line no-console
        console.log('[Stringee] Media connected - call is active');
        this.setState({ callStatus: 'connected' });
      }
    });

    

    call.on('otherdevice', (msg: any) => {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Other device', msg);
    });

    call.on('info', (info: any) => {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Call info', info);
    });

    // Add error event handler
    call.on('error', (error: any) => {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Call error:', error);
    });

    // Add ended event handler
    call.on('ended', () => {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Call ended event');
      if (this.incomingAudio) this.incomingAudio.pause();
      this.resetCallState();
    });
  };



  private resetCallState = () => {
    this.stringeeCurrentCall = null;
    this.setState({
      callPanelVisible: false,
      callFrom: undefined,
      callTo: undefined,
      callId: undefined,
      callStatus: undefined,
      isProcessing: false,
      isMuted: false,
      isSpeakerOn: false,
      isOnHold: false,
      customerInfo: undefined,
    });
  };

  private answerCall = () => {
    if (!this.stringeeCurrentCall) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] No current call to answer');
      return;
    }
    
    try {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Answering call...');
      this.setState({ isProcessing: true });
      
      // Add timeout to prevent hanging
      const answerTimeout = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.error('[Stringee] Answer call timeout after 5 seconds');
        this.setState({ isProcessing: false });
      }, 5000);
      
      this.stringeeCurrentCall.answer((res: any) => {
        clearTimeout(answerTimeout);
        // eslint-disable-next-line no-console
        console.log('[Stringee] answer res', res);
        this.setState({ isProcessing: false });
        
        if (res && res.r === 0) {
          // eslint-disable-next-line no-console
          console.log('[Stringee] ✅ Call answered successfully');
          // Force update call status to connected
          this.setState({ callStatus: 'connected' });
          if (this.incomingAudio) this.incomingAudio.pause();
        } else {
          // eslint-disable-next-line no-console
          console.error('[Stringee] ❌ Answer call failed:', res);
        }
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to answer call:', error.message);
      this.setState({ isProcessing: false });
    }
  };



  private rejectCall = () => {
    if (!this.stringeeCurrentCall) return;
    
    try {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Rejecting call...');
      this.setState({ isProcessing: true });
      
      this.stringeeCurrentCall.reject((res: any) => {
        // eslint-disable-next-line no-console
        console.log('[Stringee] reject res', res);
        this.setState({ isProcessing: false });
        if (this.incomingAudio) this.incomingAudio.pause();
        this.resetCallState();
        // eslint-disable-next-line no-console
        console.log('[Stringee] ❌ Call rejected');
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to reject call:', error.message);
      this.setState({ isProcessing: false });
    }
  };

  private hangupCall = () => {
    if (!this.stringeeCurrentCall) return;
    
    try {
      // eslint-disable-next-line no-console
      console.log('[Stringee] Hanging up call...');
      this.setState({ isProcessing: true });
      
      this.stringeeCurrentCall.hangup((res: any) => {
        // eslint-disable-next-line no-console
        console.log('[Stringee] hangup res', res);
        this.setState({ isProcessing: false });
        if (this.incomingAudio) this.incomingAudio.pause();
        this.resetCallState();
        // eslint-disable-next-line no-console
        console.log('[Stringee] 📞 Call hung up');
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to hang up call:', error.message);
      this.setState({ isProcessing: false });
    }
  };

  private toggleMute = () => {
    if (!this.stringeeCurrentCall) return;
    
    try {
      const newMutedState = !this.state.isMuted;
      this.stringeeCurrentCall.mute(newMutedState);
      this.setState({ isMuted: newMutedState });
      // eslint-disable-next-line no-console
      console.log(newMutedState ? '[Stringee] 🔇 Microphone muted' : '[Stringee] 🔊 Microphone unmuted');
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to toggle mute:', error.message);
    }
  };

  private toggleSpeaker = () => {
    try {
      const newSpeakerState = !this.state.isSpeakerOn;
      this.setState({ isSpeakerOn: newSpeakerState });
      // eslint-disable-next-line no-console
      console.log(newSpeakerState ? '[Stringee] 🔊 Speaker enabled' : '[Stringee] 🔇 Speaker disabled');
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to toggle speaker:', error.message);
    }
  };

  private toggleHold = () => {
    if (!this.stringeeCurrentCall) return;
    
    try {
      const newHoldState = !this.state.isOnHold;
      this.stringeeCurrentCall.hold(newHoldState, (res: any) => {
        // eslint-disable-next-line no-console
        console.log('[Stringee] hold res', res);
        if (res && res.r === 0) {
          this.setState({ isOnHold: newHoldState });
          // eslint-disable-next-line no-console
          console.log(newHoldState ? '[Stringee] ⏸️ Call put on hold' : '[Stringee] ▶️ Call resumed from hold');
        } else {
          // eslint-disable-next-line no-console
          console.error('[Stringee] Failed to toggle hold:', res);
        }
      });
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('[Stringee] Failed to toggle hold:', error.message);
    }
  };





  render() {
    if (!this.state.callPanelVisible) {
      return null;
    }

    console.log("this.state -->", this.state)
    return (
      <CallPanel>
        <CallTitle>Incoming call</CallTitle>
        <CallInfo>
          <CallInfoRow>To: {this.state.callTo || "-"}</CallInfoRow>
          {this.state.customerInfo && (() => {
            const c = this.state.customerInfo as any;
            const name = (c.firstName && c.lastName)
              ? `${c.firstName} ${c.lastName}`
              : (c.firstName || c.name || c.primaryPhone || '-');
            return (
              <CustomerRow>
              <NameCard.Avatar user={{...this.state.customerInfo, details: {
                avatar: c.avatar
              }}} size={40} />
                <div>
                  <div style={{ fontWeight: 600 }}>{name}</div>
                  {c.primaryPhone && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{c.primaryPhone}</div>
                  )}
                </div>
              </CustomerRow>
            );
          })()}
        </CallInfo>
        <ButtonGroup>
          {this.state.callStatus !== 'connected' ? (
            <>
              <CallButton
                variant="answer"
                onClick={this.answerCall}
                disabled={this.state.isProcessing}
              >
                Answer
              </CallButton>
              <CallButton
                variant="reject"
                onClick={this.rejectCall}
                disabled={this.state.isProcessing}
              >
                Reject
              </CallButton>
            </>
          ) : (
            <>
              <CallButton
                variant="hangup"
                onClick={this.hangupCall}
                disabled={this.state.isProcessing}
              >
                Hang up
              </CallButton>
              <CallButton
                variant="hangup"
                onClick={this.toggleHold}
                disabled={this.state.isProcessing}
              >
                {this.state.isOnHold ? 'Resume' : 'Hold'}
              </CallButton>
            </>
          )}
        </ButtonGroup>

        {this.state.callStatus === 'connected' && (
          <AudioControls>
            <AudioButton
              active={this.state.isMuted}
              onClick={this.toggleMute}
              disabled={this.state.isProcessing}
            >
              {this.state.isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </AudioButton>
            <AudioButton
              active={this.state.isSpeakerOn}
              onClick={this.toggleSpeaker}
              disabled={this.state.isProcessing}
            >
              {this.state.isSpeakerOn ? '🔊 Speaker Off' : '🔊 Speaker On'}
            </AudioButton>
          </AudioControls>
        )}
      </CallPanel>
    );
  }
}

export default IncomingCall;
