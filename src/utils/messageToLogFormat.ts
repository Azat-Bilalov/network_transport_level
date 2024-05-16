export const messageToLogFormat = <V extends { payload: string | null }>(
  message: V
) => {
  const { payload, ...rest } = message;
  const newMessage = {
    payload: payload ? payload.slice(0, 10) + "..." : null,
    ...rest,
  };
  return newMessage;
};
