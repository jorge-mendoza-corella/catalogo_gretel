export interface Client {
  address: {
    city: string | null
    state: string | null
    street: string | null
    country: string | null
    zip_code: string | null
    neighborhood: string | null
    exterior_number: string | null
    interior_number: string | null
  }
  buyer_PF: {
    id: string | number | null
    rfc: string | null
    curp: string | null
    email: string | null
    phone: string | null
    gender: string | null
    birthdate: string | null
    dial_code: string | null
    full_name: string | null
    occupation: string | null
    nationality: string | null
    marital_status: string | null
  }
  buyer_PM: {
    id: string | number | null
    rfc: string | null
    email: string | null
    country: string | null
    full_name: string | null
    legal_representative: {
      id: string | number | null
      rfc: string | null
      email: string | null
      phone: string | null
      dial_code: string | null
      full_name: string | null
    }
  }
  documents: Array<{
    link: string | null
    name: string | null
  }>
  user_type: 'PF' | 'PM'
  properties: Array<{
    area: string | null
    floor: string | null
    model: string | null
    status: string | null
    address: string | null
    project: string | null
    documents: {
      receipts_data: Array<{
        date: string | null
        concept: string | null
        evidence: string | null
        paid_amount: string | number | null
      }>
      signed_contract_link: string | null
      account_statement_data: {
        payments: Array<{
          date: string | null
          concept: string | null
          paid_amount: string | number | null
        }>
        collection: string | null
        stp_account: string | null
        project_name: string | null
        buyer_address: {
          city: string | null
          state: string | null
          street: string | null
          country: string | null
          zip_code: string | null
          neighborhood: string | null
          exterior_number: string | null
          interior_number: string | null
        }
        property_area: string | null
        purchase_date: string | null
        property_floor: string | null
        property_model: string | null
        buyer_full_name: string | null
        project_address: string | null
        property_number: string | null
        property_total_debt: string | number | null
        property_total_paid: string | number | null
        legal_representative: {
          id: string | number | null
          rfc: string | null
          email: string | null
          phone: string | null
          dial_code: string | null
          full_name: string | null
        }
        property_final_price: string | number | null
        payment_current_month: {
          billing_month: string | null
          next_payment_date: string | null
          monthly_deal_amount: string | number | null
          monthly_debt_amount: string | number | null
          monthly_paid_amount: string | number | null
        }
        payment_total_amounts: Array<{
          id: string | number | null
          payment: string | number | null
          deal_amount: string | number | null
          payment_count: string | number | null
          deal_percentage: string | number | null
          monthly_payment: string | number | null
        }>
      }
    }
    collection: string | null
    total_debt: string | number | null
    total_paid: string | number | null
    final_price: string | number | null
    property_id: string | number | null
    capital_gain: string | number | null
    project_logo: string | null
    current_value: string | number | null
    project_image: string | null
    purchase_date: string | null
    property_number: string | null
    account_reference: string | null
    external_agent_name: string | null
    internal_agent_name: string | null
    price_per_square_metre_paid: string | number | null
    price_per_square_metre_today: string | number | null
  }>
  beneficiaries: Array<{
    rel: string | null
    name: string | null
  }>
  fiscal_address: {
    city: string | null
    state: string | null
    street: string | null
    country: string | null
    zip_code: string | null
    neighborhood: string | null
    exterior_number: string | null
    interior_number: string | null
  }
}
