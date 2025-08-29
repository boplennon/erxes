const translateEndCallCause = (cause?: string): string => {
  switch (cause) {
    case 'USER_END_CALL': return 'Người dùng kết thúc';
    case 'NO_ANSWER': return 'Không trả lời';
    case 'BUSY': return 'Máy bận';
    case 'TIMEOUT': return 'Hết thời gian chờ';
    case 'REJECTED': return 'Bị từ chối';
    case 'NETWORK_ERROR': return 'Lỗi mạng';
    case 'SYSTEM_ERROR': return 'Lỗi hệ thống';
    default: return cause || '';
  }
};

const translateEndedBy = (endedBy?: string): string => {
  switch (endedBy) {
    case 'EXTERNAL': return 'Khách hàng';
    case 'INTERNAL': return 'Nhân viên';
    case 'SYSTEM': return 'Hệ thống';
    default: return endedBy || '';
  }
};

export const buildCallEventContent = (args: {
  call_status: string;
  fromNumber: string;
  actor?: string;
  duration?: number;
  answerDuration?: number;
  endCallCause?: string;
  endedBy?: string;
}) => {
  const { call_status, fromNumber, actor, duration, answerDuration, endCallCause, endedBy } = args;
  switch (call_status) {
    case 'created':
      return `📞 Cuộc gọi đến từ ${fromNumber}`;
    case 'started':
      return `🟢 Cuộc gọi đã bắt đầu`;
    case 'answered':
      return `✅ Cuộc gọi đã được trả lời bởi ${actor || 'nhân viên'}`;
    case 'ended': {
      const durationText = duration ? ` (${duration}s)` : '';
      const answerDurationText = answerDuration ? ` - Thời gian trả lời: ${answerDuration}s` : '';
      const endReason = endCallCause ? ` - Lý do: ${translateEndCallCause(endCallCause)}` : '';
      const endedByText = endedBy ? ` - Kết thúc bởi: ${translateEndedBy(endedBy)}` : '';
      return `🔴 Cuộc gọi kết thúc${durationText}${answerDurationText}${endReason}${endedByText}`;
    }
    case 'rejected':
      return `❌ Cuộc gọi bị từ chối`;
    case 'busy':
      return `🚫 Cuộc gọi bận`;
    case 'timeout':
      return `⏰ Cuộc gọi hết thời gian chờ`;
    case 'failed':
      return `❌ Cuộc gọi thất bại`;
    default:
      return `📞 Sự kiện cuộc gọi: ${call_status}`;
  }
};


