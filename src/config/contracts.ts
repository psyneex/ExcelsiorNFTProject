// Collection contract addresses
export const COLLECTIONS = [
  {
    id: 'premium',
    name: 'Premium Suites',
    address: '0xd4e809987f04357895a4afb47faf1d5518c7d8d1' as const,
    description: 'Exclusive collection of premium luxury suites',
    image: '/images/collections/premium.jpg'
  }
  // {
  //   id: 'vip',
  //   name: 'VIP Villas',
  //   address: '0x...' as const, // Replace with actual address
  //   description: 'Private villas with premium amenities',
  //   image: '/images/collections/vip.jpg'
  // },
  // {
  //   id: 'presidential',
  //   name: 'Presidential Collection',
  //   address: '0x...' as const, // Replace with actual address
  //   description: 'The most luxurious accommodations in the resort',
  //   image: '/images/collections/presidential.jpg'
  // }
] as const;

// Legacy export for backward compatibility
export const EXCELSIOR_NFT_ADDRESS = COLLECTIONS[0].address;
