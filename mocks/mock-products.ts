export type AvailableProduct = {
  id: string;
  title: string;
  description?: string;
  price: number;
  count: number;
};

export const mockProducts: AvailableProduct[] = [
  {
    id: "1",
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse with adjustable DPI.",
    price: 29.99,
    count: 15,
  },
  {
    id: "2",
    title: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with blue switches.",
    price: 89.99,
    count: 8,
  },
  {
    id: "3",
    title: "USB-C Hub",
    description: "Multiport USB-C hub with HDMI and Ethernet.",
    price: 49.99,
    count: 20,
  },
  {
    id: "4",
    title: "Noise Cancelling Headphones",
    description: "Over-ear headphones with active noise cancellation.",
    price: 199.99,
    count: 5,
  },
  {
    id: "5",
    title: "Portable SSD",
    description: "1TB portable SSD with USB 3.2 interface.",
    price: 129.99,
    count: 12,
  },
];