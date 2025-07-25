import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

const TakeOrder = ({ user }) => {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [cardInfo, setCardInfo] = useState({ card_id: '', card_holder_name: '', card_number: '', card_expiry: '' });

  const categories = ['starter', 'main', 'dessert', 'drinks'];

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/menu');
        setMenuItems(res.data);
      } catch (err) {
        console.error('Error fetching menu:', err.message);
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    const exists = cart.find(i => i.item_id === item.item_id);
    if (exists) {
      setCart(cart.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, qty) => {
    if (qty === 0) {
      setCart(cart.filter(i => i.item_id !== id));
    } else {
      setCart(cart.map(i => i.item_id === id ? { ...i, quantity: qty } : i));
    }
  };

  const getSubtotal = () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const getTotalWithTax = () => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.13;
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    };
  };

  const handleSubmitOrder = async () => {
    if (!orderType || !paymentMode || !customerInfo.name || cart.length === 0) {
      toast({
        title: 'Missing info',
        description: 'Fill customer name, order type, payment mode & add items.',
        variant: 'destructive',
      });
      return;
    }

    // Frontend card number validation
    if (paymentMode === 'card') {
      if (!cardInfo.card_number || !/^\d{16}$/.test(cardInfo.card_number)) {
        toast({
          title: 'Invalid Card Number',
          description: 'Card number must be exactly 16 digits.',
          variant: 'destructive',
        });
        return;
      }
    }

    const { subtotal, tax, total } = getTotalWithTax();

    try {
      await axios.post('http://localhost:3000/api/orders', {
        customer: customerInfo,
        orderType,
        paymentMode,
        total,
        createdBy: user.username,
        cart,
      });

      // Payment record if payment mode is card
      if (paymentMode === 'card' && cardInfo.card_number && cardInfo.card_holder_name) {
        await axios.post('http://localhost:3000/api/payment', {
          customer: customerInfo,
          card: cardInfo,
        });
      }

      toast({
        title: 'Order Placed',
        description: `Receipt:\nSubtotal: $${subtotal}\nHST (13%): $${tax}\nTotal: $${total}`,
      });

      alert(`🧾 Order Receipt\n\nSubtotal: $${subtotal}\nHST (13%): $${tax}\nTotal: $${total}`);

      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '' });
      setOrderType('');
      setPaymentMode('');
      setCardInfo({ card_id: '', card_holder_name: '', card_number: '', card_expiry: '' });
    } catch (err) {
      toast({
        title: 'Order Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Take New Order</h2>
        <p className="text-gray-600">Select items and enter customer and payment details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Section */}
        <div className="lg:col-span-2 space-y-4">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader><CardTitle className="capitalize">{category}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(i => i.category === category).map(item => (
                    <div key={item.item_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="rounded-md w-full h-40 object-cover mb-2" />
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800">{item.name}</h3>
                        <span className="font-semibold text-blue-600">${item.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? 'Available' : 'Out of Stock'}
                        </Badge>
                        <Button size="sm" onClick={() => addToCart(item)} disabled={!item.is_available}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary & Payment */}
        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No items in cart</p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.item_id} className="flex justify-between items-center">
                      <span>{item.name} x{item.quantity}</span>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.item_id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span>{item.quantity}</span>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.item_id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(item.item_id, 0)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between"><span>Subtotal:</span><span>${getSubtotal().toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>HST (13%):</span><span>${(getSubtotal() * 0.13).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total:</span><span>${(getSubtotal() * 1.13).toFixed(2)}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer & Payment Info */}
          <Card>
            <CardHeader><CardTitle>Customer & Payment Info</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {/* Order Type */}
              <Label>Order Type</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger><SelectValue placeholder="Select order type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Dine-In</SelectItem>
                  <SelectItem value="take-out">Take-Out</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Mode */}
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>

              {/* Customer Info */}
              <Label>Customer Name</Label>
              <Input value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
              {(orderType === 'take-out' || orderType === 'delivery') && (
                <>
                  <Label>Phone</Label>
                  <Input value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
                </>
              )}
              {orderType === 'delivery' && (
                <>
                  <Label>Address</Label>
                  <Input value={customerInfo.address} onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
                </>
              )}

              {/* Card Payment Details */}
              {paymentMode === 'card' && (
                <>
                  <Label>Card ID</Label>
                  <Input value={cardInfo.card_id} onChange={(e) => setCardInfo({ ...cardInfo, card_id: e.target.value })} placeholder="Card ID" />
                  <Label>Cardholder Name</Label>
                  <Input value={cardInfo.card_holder_name} onChange={(e) => setCardInfo({ ...cardInfo, card_holder_name: e.target.value })} placeholder="Cardholder Name" />
                  <Label>Card Number</Label>
                  <Input value={cardInfo.card_number} onChange={(e) => setCardInfo({ ...cardInfo, card_number: e.target.value })} placeholder="Card Number" />
                  <Label>Expiry Date</Label>
                  <Input value={cardInfo.card_expiry} onChange={(e) => setCardInfo({ ...cardInfo, card_expiry: e.target.value })} placeholder="MM/YY" />
                </>
              )}

              <Button onClick={handleSubmitOrder} className="w-full mt-2">Submit Order</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TakeOrder;