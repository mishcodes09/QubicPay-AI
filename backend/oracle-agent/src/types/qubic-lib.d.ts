/**
 * Type declarations for @qubic-lib/qubic-ts-library
 * Save this as: src/types/qubic-lib.d.ts
 * 
 * This file provides TypeScript type definitions for the Qubic library
 */

declare module '@qubic-lib/qubic-ts-library' {
  /**
   * Main transaction class for building Qubic transactions
   */
  export class QubicTransaction {
    constructor();
    setSourcePublicKey(key: PublicKey): this;
    setDestinationPublicKey(key: PublicKey): this;
    setTick(tick: number): this;
    setInputType(type: number): this;
    setInputSize(size: number): this;
    setAmount(amount: Long): this;
    setPayload(payload: DynamicPayload): this;
    build(seed: string): Promise<void>;
    encodeTransactionToBase64(data: any): string;
    getPackageData(): any;
  }

  /**
   * Represents a Qubic public key (60 characters)
   */
  export class PublicKey {
    constructor(key: string);
  }

  /**
   * Represents a 64-bit integer value
   */
  export class Long {
    constructor(value: bigint);
  }

  /**
   * Dynamic payload for transaction data
   */
  export class DynamicPayload {
    constructor(size: number);
    setPayload(data: Uint8Array): void;
    getPackageSize(): number;
  }

  /**
   * Helper for building complex payloads
   */
  export class QubicPackageBuilder {
    constructor(size: number);
    add(data: Uint8Array): void;
    getData(): Uint8Array;
  }

  /**
   * Network connector for Qubic RPC
   */
  export class QubicConnector {
    constructor(config: any);
  }

  /**
   * Helper utilities for Qubic operations
   */
  export class QubicHelper {
    static createId(seed: string): string;
  }

  /**
   * Qubic entity representation
   */
  export class QubicEntity {
    constructor();
  }

  /**
   * Tick data information
   */
  export class QubicTickData {
    constructor();
  }

  /**
   * Tick information
   */
  export class QubicTickInfo {
    constructor();
  }

  /**
   * Transaction signature
   */
  export class Signature {
    constructor();
  }

  /**
   * Default export containing all Qubic library components
   */
  interface QubicLibrary {
    crypto: any;
    QubicEntityRequest: any;
    QubicEntityResponse: any;
    QubicPackageType: any;
    ReceivedPackage: any;
    RequestResponseHeader: any;
    DynamicPayload: typeof DynamicPayload;
    Long: typeof Long;
    PublicKey: typeof PublicKey;
    QubicEntity: typeof QubicEntity;
    QubicTickData: typeof QubicTickData;
    QubicTickInfo: typeof QubicTickInfo;
    QubicTransaction: typeof QubicTransaction;
    Signature: typeof Signature;
    QubicConnector: typeof QubicConnector;
    QubicDefinitions: any;
    QubicHelper: typeof QubicHelper;
    QubicPackageBuilder: typeof QubicPackageBuilder;
    QubicTransferAssetPayload: any;
    QubicTransferSendManyPayload: any;
  }

  const QubicLib: QubicLibrary;
  export default QubicLib;
}