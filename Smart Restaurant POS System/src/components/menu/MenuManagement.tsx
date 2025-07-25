import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    available: true,
    image_url: '',
  });

  const categories = ['starter', 'main', 'dessert', 'drinks'];

  const fetchMenu = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/menu');
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      is_available: form.available ? 1 : 0,
      image_url: form.image_url,
    };

    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/api/menu/${editingId}`, payload);
        toast({ title: 'Updated', description: `${form.name} updated.` });
      } else {
        await axios.post('http://localhost:3000/api/menu', payload);
        toast({ title: 'Added', description: `${form.name} added.` });
      }
      fetchMenu();
      setForm({ name: '', category: '', price: '', available: true, image_url: '' });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Operation failed', variant: 'destructive' });
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this item?')) {
      try {
        await axios.delete(`http://localhost:3000/api/menu/${id}`);
        toast({ title: 'Deleted', description: 'Item deleted.' });
        fetchMenu();
      } catch (err) {
        toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' });
      }
    }
  };

  const toggleAvailability = async (item) => {
    const payload = {
      name: item.name,
      category: item.category,
      price: item.price,
      is_available: item.is_available ? 0 : 1,
      image_url: item.image_url,
    };
    try {
      await axios.patch(`http://localhost:3000/api/menu/${item.item_id}`, payload);
      fetchMenu();
    } catch (err) {
      toast({ title: 'Error', description: 'Toggle failed.', variant: 'destructive' });
    }
  };

  const filtered = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : 'Add Item'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Item' : 'Add Item'}</CardTitle>
            <CardDescription>Provide item details below.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch checked={form.available} onCheckedChange={(val) => setForm({ ...form, available: val })} />
              <Label>Available</Label>
            </div>
            <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Add'}</Button>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.item_id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover rounded mb-gray-100 p-2 mx-auto" />
              )}
              <p className="font-bold text-green-600 mb-2">${item.price}</p>
              <div className="flex justify-between items-center">
                <Switch checked={item.is_available} onCheckedChange={() => toggleAvailability(item)} />
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingId(item.item_id);
                    setForm({
                      name: item.name,
                      category: item.category,
                      price: item.price.toString(),
                      available: !!item.is_available,
                      image_url: item.image_url || '',
                    });
                    setShowForm(true);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.item_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;
