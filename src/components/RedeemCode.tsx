import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface RedeemCodeProps {
  tokenId: string;
}

const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx9Om3XMKVR0YwMV4GAT3FFjLaKGLGF1zO7V5BB_5KoM52rwf7CkULKv86mqihJBr8/exec';
const ADMIN_TOKEN = 'jVzQ6#6hYzQJ@Z&ChhHP'; // Move to .env in production

export function RedeemCode({ tokenId }: RedeemCodeProps) {
  const [status, setStatus] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessage } = useSignMessage();

  const handleRedeem = async () => {
    if (!isConnected || !address) {
      setStatus('Please connect your wallet first');
      return;
    }

    try {
      setStatus('Fetching code...');
      
      // 1. Get the code from Google Sheet
      const url = `${APP_SCRIPT_URL}?q=get_code&tokenId=${encodeURIComponent(tokenId)}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.status !== 'ok') {
        throw new Error(result.error || 'Failed to fetch code');
      }

      if (result.wallet) {
        throw new Error('This code has already been redeemed');
      }

      setCode(result.code);
      setStatus('Please sign the message to confirm...');

      // 2. Sign message for verification
      const message = `Redeem code ${result.code} for token ${tokenId}`;
      const signature = await signMessage({ message });

      // 3. Submit redemption
      const redeemResponse = await fetch(APP_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem_code',
          wallet: address,
          codePlain: result.code,
          tokenId: tokenId,
          signature: signature,
          adminToken: ADMIN_TOKEN
        })
      });

      const redeemResult = await redeemResponse.json();
      
      if (redeemResult.status === 'ok') {
        setStatus('Successfully redeemed!');
      } else {
        throw new Error(redeemResult.error || 'Redemption failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
      <h3 style={{ marginTop: 0 }}>Redeem Your Benefits</h3>
      <p>Token ID: {tokenId}</p>

      {code && (
        <>
          <button
            onClick={() => setRevealed(!revealed)}
            style={{
              marginBottom: '0.5rem',
              backgroundColor: '#e5e7eb',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            {revealed ? 'Hide Code' : 'Show Code'}
          </button>

          {revealed && (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '0.5rem', 
              marginBottom: '0.5rem',
              borderRadius: '0.25rem',
              fontFamily: 'monospace'
            }}>
              {code}
            </div>
          )}
        </>
      )}

      <button
        onClick={handleRedeem}
        disabled={!isConnected || status.includes('redeemed')}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          opacity: !isConnected || status.includes('redeemed') ? 0.5 : 1
        }}
      >
        {status || 'Reveal Code'}
      </button>
    </div>
  );
}
