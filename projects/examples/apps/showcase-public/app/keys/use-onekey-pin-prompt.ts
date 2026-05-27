import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import type { PinPromptState } from './onekey-pin-prompt';
import {
  type OneKeySdkResult,
  type SdkInstance,
  UI_CLOSE_PIN_WINDOW,
  UI_EVENT,
  UI_INVALID_PIN,
  UI_RECEIVE_PIN,
  UI_REQUEST_PIN,
} from './onekey-sdk';

interface UseOneKeyPinPromptParams {
  sdkRef: MutableRefObject<SdkInstance | null>;
  deviceConnectId: string | undefined;
  onCancelled: () => void;
}

export function useOneKeyPinPrompt({
  sdkRef,
  deviceConnectId,
  onCancelled,
}: UseOneKeyPinPromptParams) {
  const sdkUiBoundRef = useRef(false);
  const pinFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinPrompt, setPinPrompt] = useState<PinPromptState | null>(null);
  const [activePinKey, setActivePinKey] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (pinFeedbackTimerRef.current) {
        clearTimeout(pinFeedbackTimerRef.current);
      }
    },
    [],
  );

  function pulsePinKey(key: string) {
    setActivePinKey(key);
    if (pinFeedbackTimerRef.current) clearTimeout(pinFeedbackTimerRef.current);
    pinFeedbackTimerRef.current = setTimeout(() => {
      setActivePinKey(null);
    }, 140);
  }

  function attachSdkUiListeners(sdk: OneKeySdkResult) {
    if (sdkUiBoundRef.current) return;
    sdkUiBoundRef.current = true;
    sdk.on(UI_EVENT, (event) => {
      if (event.type === UI_REQUEST_PIN) {
        setPinPrompt({
          requestType:
            typeof (event.payload as { type?: unknown } | undefined)?.type === 'string'
              ? ((event.payload as { type?: string }).type ?? null)
              : null,
          digits: '',
          invalid: false,
        });
        return;
      }
      if (event.type === UI_INVALID_PIN) {
        setPinPrompt((prev) => ({
          requestType: prev?.requestType ?? null,
          digits: '',
          invalid: true,
        }));
        return;
      }
      if (event.type === UI_CLOSE_PIN_WINDOW) {
        setPinPrompt(null);
      }
    });
  }

  function appendPinDigit(digit: string) {
    pulsePinKey(digit);
    setPinPrompt((prev) => {
      if (!prev) return prev;
      return { ...prev, digits: `${prev.digits}${digit}`, invalid: false };
    });
  }

  function clearLastPinDigit() {
    setPinPrompt((prev) => {
      if (!prev || prev.digits.length === 0) return prev;
      return { ...prev, digits: prev.digits.slice(0, -1), invalid: false };
    });
  }

  function submitPinPrompt() {
    const sdk = sdkRef.current as OneKeySdkResult | null;
    if (!sdk || !pinPrompt?.digits) return;
    sdk.uiResponse({ type: UI_RECEIVE_PIN, payload: pinPrompt.digits });
    setPinPrompt(null);
  }

  function cancelPinPrompt() {
    const sdk = sdkRef.current as OneKeySdkResult | null;
    sdk?.cancel(deviceConnectId);
    setPinPrompt(null);
    onCancelled();
  }

  return {
    pinPrompt,
    activePinKey,
    setPinPrompt,
    attachSdkUiListeners,
    appendPinDigit,
    clearLastPinDigit,
    submitPinPrompt,
    cancelPinPrompt,
  };
}
