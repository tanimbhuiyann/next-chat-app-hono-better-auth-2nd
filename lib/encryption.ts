import CryptoJS from 'crypto-js';
import NodeRSA from 'node-rsa';

// Direct backend URL to avoid config issues
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export class EncryptionService {
  private static instance: EncryptionService;
  private keyPair: NodeRSA | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Generate RSA key pair (2048-bit)
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const key = new NodeRSA({ b: 2048 });
    this.keyPair = key;
    
    return {
      publicKey: key.exportKey('public'),
      privateKey: key.exportKey('private')
    };
  }

  // Load private key from localStorage
  loadPrivateKey(): boolean {
    const privateKey = localStorage.getItem('rsa_private_key');
    if (privateKey) {
      try {
        this.keyPair = new NodeRSA(privateKey);
        return true;
      } catch (error) {
        console.error('Failed to load private key:', error);
        localStorage.removeItem('rsa_private_key');
      }
    }
    return false;
  }

  // Save private key to localStorage
  savePrivateKey(privateKey: string): void {
    localStorage.setItem('rsa_private_key', privateKey);
    this.keyPair = new NodeRSA(privateKey);
  }

  // Get public key
  getPublicKey(): string | null {
    return this.keyPair?.exportKey('public') || null;
  }

  // Generate AES key (256-bit)
  generateAESKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  }

  // Encrypt message with AES
  encryptMessage(message: string, aesKey: string): string {
    return CryptoJS.AES.encrypt(message, aesKey).toString();
  }

  // Decrypt message with AES
  decryptMessage(encryptedMessage: string, aesKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, aesKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Encrypt AES key with RSA public key
  encryptAESKey(aesKey: string, publicKey: string): string {
    const key = new NodeRSA(publicKey);
    return key.encrypt(aesKey, 'base64');
  }

  // Decrypt AES key with RSA private key
  decryptAESKey(encryptedAESKey: string): string {
    if (!this.keyPair) {
      throw new Error('Private key not loaded');
    }
    return this.keyPair.decrypt(encryptedAESKey, 'utf8');
  }

  // Initialize user keys (call on first login or if no keys exist)
  async initializeUserKeys(userId: string): Promise<void> {
    console.log('Initializing user keys for:', userId);
    console.log('Backend URL:', BACKEND_URL);
    
    // Try to load existing private key
    const hasPrivateKey = this.loadPrivateKey();
    console.log('Has private key in localStorage:', hasPrivateKey);
    
    if (!hasPrivateKey) {
      console.log('Generating new RSA key pair...');
      const { publicKey, privateKey } = this.generateKeyPair();
      
      // Save private key locally
      this.savePrivateKey(privateKey);
      console.log('Private key saved to localStorage');
      
      // Send public key to server
      console.log('Sending public key to server...');
      const url = `${BACKEND_URL}/api/keys/save`;
      console.log('Full URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          publicKey
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save public key:', response.status, errorText);
        throw new Error(`Failed to save public key to server: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Public key saved successfully:', result);
    } else {
      // Check if public key exists in database
      console.log('Checking if public key exists in database...');
      try {
        const url = `${BACKEND_URL}/api/keys/${userId}`;
        console.log('Checking URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          console.log('Public key not found in database, uploading...');
          // Public key not in database, upload it
          const publicKey = this.getPublicKey();
          if (publicKey) {
            const uploadUrl = `${BACKEND_URL}/api/keys/save`;
            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                publicKey
              })
            });
            
            if (uploadResponse.ok) {
              console.log('Existing public key uploaded to database');
            } else {
              const errorText = await uploadResponse.text();
              console.error('Failed to upload existing key:', uploadResponse.status, errorText);
            }
          }
        } else {
          console.log('Public key already exists in database');
        }
      } catch (error) {
        console.error('Error checking/uploading public key:', error);
      }
    }
  }

  // Get recipient's public key from server
  async getRecipientPublicKey(userId: string): Promise<string> {
    const url = `${BACKEND_URL}/api/keys/${userId}`;
    console.log('Fetching public key from:', url); // Debug log
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch public key:', response.status, errorText);
      throw new Error(`Failed to fetch recipient public key: ${response.status}`);
    }
    const data = await response.json();
    return data.publicKey;
  }
}