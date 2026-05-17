import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { WALLET_ACTIONS_SNIPPET } from './wallet-data';
import {
  actionBtn,
  FORM_GRID,
  INPUT_STYLE,
  LABEL_STYLE,
  MUTED_TEXT,
  TWO_COL_GRID,
} from './wallet-styles';

interface WalletActionCardsProps {
  core: { isConnected: boolean };
  coreActionError: string;
  coreBusy: boolean;
  coreMessage: string;
  coreSignature: string;
  coreTxHash: string;
  coreTypedSignature: string;
  coreValue: string;
  espaceActionError: string;
  espaceBusy: boolean;
  espaceMessage: string;
  espaceSignature: string;
  espaceTxHash: string;
  espaceTypedSignature: string;
  espaceValue: string;
  onCoreMessageChange(value: string): void;
  onCoreValueChange(value: string): void;
  onEspaceMessageChange(value: string): void;
  onEspaceValueChange(value: string): void;
  onSendCoreSelfTransfer(): void;
  onSendEspaceSelfTransfer(): void;
  onSignCoreMessage(): void;
  onSignCoreTypedData(): void;
  onSignEspaceMessage(): void;
  onSignEspaceTypedData(): void;
  validHexAddress: `0x${string}` | undefined;
  walletReady: boolean;
}

export function WalletActionCards(props: WalletActionCardsProps) {
  return (
    <>
      <MessageSigningCard {...props} />
      <NativeTransferCard {...props} />
    </>
  );
}

function MessageSigningCard(props: WalletActionCardsProps) {
  const eSpaceDisabled = !props.walletReady || !props.validHexAddress || props.espaceBusy;
  const coreDisabled = !props.core.isConnected || props.coreBusy;
  return (
    <DemoCard
      title="Message Signing"
      description="personal_sign plus typed-data demos for eSpace (EIP-712) and Core Space (CIP-23)."
    >
      <div style={TWO_COL_GRID}>
        <div style={FORM_GRID}>
          <StatusBadge
            status={props.walletReady && props.validHexAddress ? 'ok' : 'pending'}
            label={
              props.walletReady && props.validHexAddress ? 'eSpace wallet ready' : 'Connect eSpace'
            }
          />
          <label style={LABEL_STYLE}>
            personal_sign message
            <input
              value={props.espaceMessage}
              onChange={(event) => props.onEspaceMessageChange(event.target.value)}
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            onClick={() => void props.onSignEspaceMessage()}
            disabled={eSpaceDisabled}
            style={actionBtn(eSpaceDisabled)}
          >
            {props.espaceBusy ? 'Awaiting wallet...' : 'Sign personal message'}
          </button>
          <button
            type="button"
            onClick={() => void props.onSignEspaceTypedData()}
            disabled={eSpaceDisabled}
            style={actionBtn(eSpaceDisabled)}
          >
            Sign EIP-712 payload
          </button>
          {props.espaceSignature && (
            <CodeSnippet code={props.espaceSignature} label="eSpace signature" />
          )}
          {props.espaceTypedSignature && (
            <CodeSnippet code={props.espaceTypedSignature} label="EIP-712 signature" />
          )}
        </div>
        <div style={FORM_GRID}>
          <StatusBadge
            status={props.core.isConnected ? 'ok' : 'pending'}
            label={props.core.isConnected ? 'Core wallet ready' : 'Connect Core'}
          />
          <label style={LABEL_STYLE}>
            Core personal_sign message
            <input
              value={props.coreMessage}
              onChange={(event) => props.onCoreMessageChange(event.target.value)}
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            onClick={() => void props.onSignCoreMessage()}
            disabled={coreDisabled}
            style={actionBtn(coreDisabled)}
          >
            {props.coreBusy ? 'Awaiting wallet...' : 'Sign Core message'}
          </button>
          <button
            type="button"
            onClick={() => void props.onSignCoreTypedData()}
            disabled={coreDisabled}
            style={actionBtn(coreDisabled)}
          >
            Sign CIP-23 payload
          </button>
          {props.coreSignature && <CodeSnippet code={props.coreSignature} label="Core signature" />}
          {props.coreTypedSignature && (
            <CodeSnippet code={props.coreTypedSignature} label="CIP-23 signature" />
          )}
        </div>
      </div>
      {(props.espaceActionError || props.coreActionError) && (
        <p style={errorTextStyle}>{props.espaceActionError || props.coreActionError}</p>
      )}
      <CodeSnippet code={WALLET_ACTIONS_SNIPPET} label="Action APIs" />
    </DemoCard>
  );
}

function NativeTransferCard(props: WalletActionCardsProps) {
  const eSpaceDisabled = !props.walletReady || !props.validHexAddress || props.espaceBusy;
  const coreDisabled = !props.core.isConnected || props.coreBusy;
  return (
    <DemoCard
      title="Send Native CFX"
      description="Self-transfer helpers for eSpace and Core Space. The default amount is 0 CFX so the flow can demonstrate wallet submission with minimal risk."
    >
      <div style={TWO_COL_GRID}>
        <div style={FORM_GRID}>
          <label style={LABEL_STYLE}>
            eSpace amount (CFX)
            <input
              value={props.espaceValue}
              onChange={(event) => props.onEspaceValueChange(event.target.value)}
              inputMode="decimal"
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            onClick={() => void props.onSendEspaceSelfTransfer()}
            disabled={eSpaceDisabled}
            style={actionBtn(eSpaceDisabled)}
          >
            Send eSpace to self
          </button>
          {props.espaceTxHash && (
            <CodeSnippet code={props.espaceTxHash} label="eSpace transaction hash" />
          )}
        </div>
        <div style={FORM_GRID}>
          <label style={LABEL_STYLE}>
            Core amount (CFX)
            <input
              value={props.coreValue}
              onChange={(event) => props.onCoreValueChange(event.target.value)}
              inputMode="decimal"
              style={INPUT_STYLE}
            />
          </label>
          <button
            type="button"
            onClick={() => void props.onSendCoreSelfTransfer()}
            disabled={coreDisabled}
            style={actionBtn(coreDisabled)}
          >
            Send Core to self
          </button>
          {props.coreTxHash && (
            <CodeSnippet code={props.coreTxHash} label="Core transaction hash" />
          )}
        </div>
      </div>
    </DemoCard>
  );
}

const errorTextStyle: React.CSSProperties = {
  ...MUTED_TEXT,
  color: 'var(--cfx-color-feedback-danger)',
  marginTop: 'var(--cfx-space-3)',
};
