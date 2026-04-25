// components/inventory/ProductCard.tsx

interface ProductProps {
  name: string;
  quantity: number;
  price: number;
}

export const ProductCard = ({ name, quantity, price }: ProductProps) => {
  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-gray-600">Quantité en stock : {quantity}</p>
      <p className="text-blue-600 font-semibold">{price} FC</p>
      {quantity < 5 && (
        <span className="text-red-500 text-sm">⚠️ Stock critique !</span>
      )}
    </div>
  );
};