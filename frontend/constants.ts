
import { Restaurant, FriendRating } from './types';

const MOCK_FRIENDS: FriendRating[] = [
  { name: 'Lucas', avatar: 'https://i.pravatar.cc/150?u=lucas', rating: 5 },
  { name: 'Manon', avatar: 'https://i.pravatar.cc/150?u=manon', rating: 4 },
  { name: 'Chloé', avatar: 'https://i.pravatar.cc/150?u=chloe', rating: 5 },
  { name: 'Enzo', avatar: 'https://i.pravatar.cc/150?u=enzo', rating: 3 },
  { name: 'Léa', avatar: 'https://i.pravatar.cc/150?u=lea', rating: 4 },
];

export const RESTAURANTS_DATA: Restaurant[] = [
  {
    id: '1',
    name: 'Ichi-go Ichi-e',
    country: 'Japan',
    address: '31 Rue Fouré, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Tonkotsu Ramen',
    description: 'Nantes\' legendary ramen destination. The broth is simmered for 18 hours. A true slice of Tokyo in the Cité des Ducs.',
    friendRatings: [MOCK_FRIENDS[0], MOCK_FRIENDS[1], MOCK_FRIENDS[2]]
  },
  {
    id: '8',
    name: 'Ramen Ya',
    country: 'Japan',
    address: '26 Rue de la Fosse, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Shoyu Ramen',
    description: 'Minimalist, fast, and incredibly consistent. Perfect for a quick culinary trip near the Passage Pommeraye.',
    friendRatings: [MOCK_FRIENDS[3], MOCK_FRIENDS[4]]
  },
  {
    id: '13',
    name: 'Izakaya Joyi',
    country: 'Japan',
    address: '4 Rue de Colmar, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1581184953963-d15972933db2?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Assortiment de Sashimi',
    description: 'High-end Japanese dining. Focuses on the art of the Izakaya with refined small plates and premium sake.',
    friendRatings: [MOCK_FRIENDS[0], MOCK_FRIENDS[2]]
  },
  {
    id: '2',
    name: 'Ethio',
    country: 'Ethiopia',
    address: '2 Rue de la Juiverie, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1541518763669-279f00ed02ae?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Yebeg Wot Platter',
    description: 'Authentic communal dining. The injera is tangy and soft, providing the perfect vessel for rich, spicy stews.',
    friendRatings: [MOCK_FRIENDS[1], MOCK_FRIENDS[4]]
  },
  {
    id: '4',
    name: 'Le Beyrouth',
    country: 'Lebanon',
    address: '9 Rue de l\'Emery, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1544124499-58912cbddade?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Hummus & Falafel Royale',
    description: 'Family-run institution in Bouffay. The hummus is widely considered the creamiest in Western France.',
    friendRatings: [MOCK_FRIENDS[0], MOCK_FRIENDS[3]]
  },
  {
    id: '14',
    name: 'L\'Orientale',
    country: 'Lebanon',
    address: '12 Rue des Petites Écuries, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1637933660716-44485bc94857?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Chawarma Poulet',
    description: 'Traditional Lebanese grill with a modern twist. Their garlic sauce is a local legend.',
    friendRatings: [MOCK_FRIENDS[2]]
  },
  {
    id: '5',
    name: 'Pépé José',
    country: 'Mexico',
    address: '27 Rue de Briord, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Tacos al Pastor',
    description: 'Street-food vibes with serious flavor. The pineapple and marinated pork combination is life-changing.',
    friendRatings: [MOCK_FRIENDS[4], MOCK_FRIENDS[0], MOCK_FRIENDS[1]]
  },
  {
    id: '15',
    name: 'La Cantina',
    country: 'Mexico',
    address: '28 Rue de la Juiverie, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1504670073073-6123e39e0754?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Enchiladas Rojas',
    description: 'A cozy corner for deep Mexican tradition. Their hot sauces are ranked by intensity for the brave.',
    friendRatings: [MOCK_FRIENDS[3]]
  },
  {
    id: '6',
    name: 'Vincenzo',
    country: 'Italy',
    address: '15 Rue de la Juiverie, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Napolitan Margherita',
    description: 'AVPN certified pizza. Using only volcanic tomatoes and bufala mozzarella. Simplistic perfection.',
    friendRatings: [MOCK_FRIENDS[0], MOCK_FRIENDS[1], MOCK_FRIENDS[2], MOCK_FRIENDS[4]]
  },
  {
    id: '16',
    name: '180g Pizza',
    country: 'Italy',
    address: '6 Rue de l\'Hôtel de Ville, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Pizza au Poids',
    description: 'Modern Italian street food. Light, airy crusts and innovative seasonal toppings.',
    friendRatings: [MOCK_FRIENDS[3]]
  },
  {
    id: '3',
    name: 'Song Saveurs',
    country: 'China',
    address: '25 Rue de Strasbourg, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Mapo Tofu de Sichuan',
    description: 'Authentic Sichuan spices that dance on the tongue. Elegant dining in a contemporary setting.',
    friendRatings: [MOCK_FRIENDS[1], MOCK_FRIENDS[2]]
  },
  {
    id: '11',
    name: 'Le Labo',
    country: 'Vietnam',
    address: '19 Rue Léon Blum, 44000 Nantes',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=1000',
    specialty: 'Phở Traditionnel',
    description: 'The aromatic steam from their Phở pots greets you before you even enter. Essential Vietnamese soul food.',
    friendRatings: [MOCK_FRIENDS[0], MOCK_FRIENDS[4]]
  }
];

export const APP_COLORS = {
  primary: '#ff9f1c',
  secondary: '#2ec4b6',
  background: '#081c1b',
  card: '#0d2624',
  border: '#1a3b38',
  rainbow: [
    '#ff9f1c', // Amber Glow
    '#ffbf69', // Honey Bronze
    '#2ec4b6', // Light Sea Green
    '#cbf3f0', // Frozen Water
    '#ffffff', // White
    '#ff9f1c',
    '#2ec4b6'
  ]
};

