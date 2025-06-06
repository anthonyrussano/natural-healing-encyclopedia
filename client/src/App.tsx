
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { 
  NaturalHealingItemWithRelations, 
  Category, 
  Tag, 
  CreateNaturalHealingItemInput,
  CreateCategoryInput,
  CreateTagInput,
  ProtocolWithItems,
  ProtocolWithMetadata,
  CreateProtocolInput
} from '../../server/src/schema';

function App() {
  // State for data
  const [items, setItems] = useState<NaturalHealingItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [protocols, setProtocols] = useState<ProtocolWithItems[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolWithMetadata | null>(null);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // State for forms
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  
  // Item form state
  const [itemForm, setItemForm] = useState<CreateNaturalHealingItemInput>({
    name: '',
    description: '',
    properties: '',
    uses: '',
    potential_side_effects: null,
    image_url: null,
    category_id: 0,
    tag_ids: []
  });
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState<CreateCategoryInput>({
    name: '',
    description: null
  });
  
  // Tag form state
  const [tagForm, setTagForm] = useState<CreateTagInput>({
    name: '',
    description: null
  });
  
  // Protocol form state
  const [protocolForm, setProtocolForm] = useState<CreateProtocolInput>({
    name: '',
    description: null,
    item_ids: []
  });

  // Load data functions
  const loadItems = useCallback(async () => {
    try {
      const result = await trpc.getNaturalHealingItems.query();
      setItems(result);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getTags.query();
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const loadProtocols = useCallback(async () => {
    try {
      const result = await trpc.getProtocols.query();
      setProtocols(result);
    } catch (error) {
      console.error('Failed to load protocols:', error);
    }
  }, []);

  const loadProtocolById = useCallback(async (id: number) => {
    try {
      const result = await trpc.getProtocolById.query(id);
      setSelectedProtocol(result);
    } catch (error) {
      console.error('Failed to load protocol:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadItems();
    loadCategories();
    loadTags();
    loadProtocols();
  }, [loadItems, loadCategories, loadTags, loadProtocols]);

  // Filter items based on search and filters
  const filteredItems = items.filter((item: NaturalHealingItemWithRelations) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id.toString() === selectedCategory;
    const matchesTag = selectedTag === 'all' || item.tags.some((tag: Tag) => tag.id.toString() === selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });

  // Form handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.category_id) return;
    
    setIsLoading(true);
    try {
      await trpc.createNaturalHealingItem.mutate(itemForm);
      await loadItems();
      setItemForm({
        name: '',
        description: '',
        properties: '',
        uses: '',
        potential_side_effects: null,
        image_url: null,
        category_id: 0,
        tag_ids: []
      });
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createCategory.mutate(categoryForm);
      await loadCategories();
      setCategoryForm({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createTag.mutate(tagForm);
      await loadTags();
      setTagForm({ name: '', description: null });
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createProtocol.mutate(protocolForm);
      await loadProtocols();
      setProtocolForm({ name: '', description: null, item_ids: [] });
    } catch (error) {
      console.error('Failed to create protocol:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number, checked: boolean) => {
    setItemForm((prev: CreateNaturalHealingItemInput) => ({
      ...prev,
      tag_ids: checked 
        ? [...(prev.tag_ids || []), tagId]
        : (prev.tag_ids || []).filter((id: number) => id !== tagId)
    }));
  };

  const handleProtocolItemToggle = (itemId: number, checked: boolean) => {
    setProtocolForm((prev: CreateProtocolInput) => ({
      ...prev,
      item_ids: checked 
        ? [...(prev.item_ids || []), itemId]
        : (prev.item_ids || []).filter((id: number) => id !== itemId)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🌿 Natural Healing Encyclopedia</h1>
          <p className="text-lg text-gray-600">Your comprehensive guide to natural remedies and healing protocols</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items">🌱 Items</TabsTrigger>
            <TabsTrigger value="protocols">📋 Protocols</TabsTrigger>
            <TabsTrigger value="categories">🏷️ Categories</TabsTrigger>
            <TabsTrigger value="tags">🔖 Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 Search & Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-filter">Filter by Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category-filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tag-filter">Filter by Tag</Label>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger id="tag-filter">
                        <SelectValue placeholder="All Tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {tags.map((tag: Tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Item Form */}
            <Card>
              <CardHeader>
                <CardTitle>➕ Add New Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-name">Name</Label>
                      <Input
                        id="item-name"
                        value={itemForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-category">Category</Label>
                      <Select 
                        value={itemForm.category_id ? itemForm.category_id.toString() : ''}
                        onValueChange={(value: string) => 
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ ...prev, category_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger id="item-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category: Category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="item-description">Description</Label>
                    <Textarea
                      id="item-description"
                      value={itemForm.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setItemForm((prev: CreateNaturalHealingItemInput) => ({ ...prev, description: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-properties">Properties</Label>
                      <Textarea
                        id="item-properties"
                        value={itemForm.properties}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ ...prev, properties: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-uses">Uses</Label>
                      <Textarea
                        id="item-uses"
                        value={itemForm.uses}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ ...prev, uses: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-side-effects">Potential Side Effects</Label>
                      <Textarea
                        id="item-side-effects"
                        value={itemForm.potential_side_effects || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ 
                            ...prev, 
                            potential_side_effects: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-image">Image URL</Label>
                      <Input
                        id="item-image"
                        type="url"
                        value={itemForm.image_url || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setItemForm((prev: CreateNaturalHealingItemInput) => ({ 
                            ...prev, 
                            image_url: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag: Tag) => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={(itemForm.tag_ids || []).includes(tag.id)}
                            onCheckedChange={(checked: boolean) => handleTagToggle(tag.id, checked)}
                          />
                          <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                            {tag.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '✨ Create Item'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Items List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item: NaturalHealingItemWithRelations) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <Badge variant="secondary">{item.category.name}</Badge>
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-green-700">🌟 Properties</h4>
                      <p className="text-sm text-gray-600">{item.properties}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700">💊 Uses</h4>
                      <p className="text-sm text-gray-600">{item.uses}</p>
                    </div>
                    {item.potential_side_effects && (
                      <div>
                        <h4 className="font-semibold text-red-700">⚠️ Potential Side Effects</h4>
                        <p className="text-sm text-gray-600">{item.potential_side_effects}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag: Tag) => (
                        <Badge key={tag.id} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            {/* Add Protocol Form */}
            <Card>
              <CardHeader>
                <CardTitle>➕ Create New Protocol</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProtocol} className="space-y-4">
                  <div>
                    <Label htmlFor="protocol-name">Protocol Name</Label>
                    <Input
                      id="protocol-name"
                      value={protocolForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProtocolForm((prev: CreateProtocolInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="protocol-description">Description</Label>
                    <Textarea
                      id="protocol-description"
                      value={protocolForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setProtocolForm((prev: CreateProtocolInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Select Items for Protocol</Label>
                    <ScrollArea className="h-40 w-full border rounded p-4 mt-2">
                      <div className="space-y-2">
                        {items.map((item: NaturalHealingItemWithRelations) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`protocol-item-${item.id}`}
                              checked={(protocolForm.item_ids || []).includes(item.id)}
                              onCheckedChange={(checked: boolean) => handleProtocolItemToggle(item.id, checked)}
                            />
                            <Label htmlFor={`protocol-item-${item.id}`} className="text-sm">
                              {item.name} ({item.category.name})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '📋 Create Protocol'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Protocols List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {protocols.map((protocol: ProtocolWithItems) => (
                <Card key={protocol.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>📋 {protocol.name}</span>
                      <Badge variant="outline">{protocol.items.length} items</Badge>
                    </CardTitle>
                    {protocol.description && (
                      <CardDescription>{protocol.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold">Items in this protocol:</h4>
                      <div className="flex flex-wrap gap-1">
                        {protocol.items.map((item: NaturalHealingItemWithRelations) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      onClick={() => loadProtocolById(protocol.id)}
                      className="w-full"
                    >
                      📊 View Detailed Analysis
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Protocol Detail Dialog */}
            {selectedProtocol && (
              <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>📋 {selectedProtocol.name} - Detailed Analysis</DialogTitle>
                    {selectedProtocol.description && (
                      <DialogDescription>{selectedProtocol.description}</DialogDescription>
                    )}
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">📊 Aggregated Metadata</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">🌟 Common Properties</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {selectedProtocol.aggregated_metadata.common_properties.map((prop: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {prop}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">💊 Common Uses</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {selectedProtocol.aggregated_metadata.common_uses.map((use: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {use}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">🏷️ Categories Represented</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {selectedProtocol.aggregated_metadata.categories.map((category: Category) => (
                                <Badge key={category.id} variant="secondary" className="text-xs">
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">🔖 All Tags</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {selectedProtocol.aggregated_metadata.tags.map((tag: Tag) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {selectedProtocol.aggregated_metadata.all_side_effects.length > 0 && (
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle className="text-base text-red-700">⚠️ All Potential Side Effects</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {selectedProtocol.aggregated_metadata.all_side_effects.map((effect: string, index: number) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {effect}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">🌱 Items in Protocol</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProtocol.items.map((item: NaturalHealingItemWithRelations) => (
                          <Card key={item.id} className="text-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <Badge variant="secondary" className="w-fit">
                                {item.category.name}
                              </Badge>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-xs text-gray-600">{item.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map((tag: Tag) => (
                                  <Badge key={tag.id} variant="outline" className="text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>➕ Add New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCategoryForm((prev: CreateCategoryInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '🏷️ Create Category'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category: Category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle>🏷️ {category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">
                      {items.filter((item: NaturalHealingItemWithRelations) => item.category_id === category.id).length} items
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>➕ Add New Tag</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Tag Name</Label>
                    <Input
                      id="tag-name"
                      value={tagForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTagForm((prev: CreateTagInput) => ({ ...prev, name: e.target.value }))
                      
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-description">Description</Label>
                    
                    <Textarea
                      id="tag-description"
                      value={tagForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTagForm((prev: CreateTagInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '🔖 Create Tag'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag: Tag) => (
                <Card key={tag.id}>
                  <CardHeader>
                    <CardTitle>🔖 {tag.name}</CardTitle>
                    {tag.description && (
                      <CardDescription>{tag.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline">
                      {items.filter((item: NaturalHealingItemWithRelations) => 
                        item.tags.some((itemTag: Tag) => itemTag.id === tag.id)
                      ).length} items
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
