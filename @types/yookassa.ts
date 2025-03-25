export interface PaymentData {
    id: string;
    status: string;
    amount: Amount;
    description: string;
    recipient: Recipient;
    created_at: string;
    confirmation: Confirmation;
    test: boolean;
    paid: boolean;
    refundable: boolean;
    metadata: Metadata;
  }
  
  export interface Amount {
    value: string;
    currency: string;
  }
  
  export interface Recipient {
    account_id: string;
    gateway_id: string;
  }
  
  export interface Confirmation {
    type: string;
    confirmation_url: string;
  }
  
  export interface Metadata {
    order_id: string;
  }