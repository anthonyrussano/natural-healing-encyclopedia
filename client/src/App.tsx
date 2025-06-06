import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { 
  NaturalHealingItemWithRelations, 
  Category, 
  Tag, 
  Property,
  Use,
  CreateNaturalHealingItemInput,
  CreateCategoryInput,
  CreateTagInput,
  CreatePropertyInput,
  CreateUseInput,
  ProtocolWithItems,
  ProtocolWithMetadata,
  CreateProtocolInput
} from '../../server/src/schema';

function App() {
  // State for data
  const [items, setItems] = useState<NaturalHealingItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [uses, setUses] = useState<Use[]>([]);
  const [protocols, setProtocols] = useState<ProtocolWithItems[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolWithMetadata | null>(null);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  
  // State for forms and modals
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [editingItem, setEditingItem] = useState<NaturalHealingItemWithRelations | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingUse, setEditingUse] = useState<Use | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<ProtocolWithItems | null>(null);
  
  // Item form state
  const [itemForm, setItemForm] = useState<CreateNaturalHealingItemInput>({
    name: '',
    description: '',
    potential_side_effects: null,
    image_url: null,
    category_id: 0,
    tag_ids: [],
    property_ids: [],
    use_ids: []
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

  // Property form state
  const [propertyForm, setPropertyForm] = useState<CreatePropertyInput>({
    name: '',
    source: null
  });

  // Use form state
  const [useForm, setUseForm] = useState<CreateUseInput>({
    name: '',
    source: null
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

  const loadProperties = useCallback(async () => {
    try {
      const result = await trpc.getProperties.query();
      setProperties(result);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  }, []);

  const loadUses = useCallback(async () => {
    try {
      const result = await trpc.getUses.query();
      setUses(result);
    } catch (error) {
      console.error('Failed to load uses:', error);
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
    loadProperties();
    loadUses();
    loadProtocols();
  }, [loadItems, loadCategories, loadTags, loadProperties, loadUses, loadProtocols]);

  // Filter items based on search and filters
  const filteredItems = items.filter((item: NaturalHealingItemWithRelations) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id.toString() === selectedCategory;
    const matchesTag = selectedTag === 'all' || item.tags.some((tag: Tag) => tag.id.toString() === selectedTag);
    return matchesSearch && matchesCategory && matchesTag;
  });

  // Reset forms
  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      potential_side_effects: null,
      image_url: null,
      category_id: 0,
      tag_ids: [],
      property_ids: [],
      use_ids: []
    });
    setEditingItem(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: null });
    setEditingCategory(null);
  };

  const resetTagForm = () => {
    setTagForm({ name: '', description: null });
    setEditingTag(null);
  };

  const resetPropertyForm = () => {
    setPropertyForm({ name: '', source: null });
    setEditingProperty(null);
  };

  const resetUseForm = () => {
    setUseForm({ name: '', source: null });
    setEditingUse(null);
  };

  const resetProtocolForm = () => {
    setProtocolForm({ name: '', description: null, item_ids: [] });
    setEditingProtocol(null);
  };

  // Edit handlers
  const startEditItem = (item: NaturalHealingItemWithRelations) => {
    setItemForm({
      name: item.name,
      description: item.description,
      potential_side_effects: item.potential_side_effects,
      image_url: item.image_url,
      category_id: item.category_id,
      tag_ids: item.tags.map((tag: Tag) => tag.id),
      property_ids: item.properties.map((property: Property) => property.id),
      use_ids: item.uses.map((use: Use) => use.id)
    });
    setEditingItem(item);
  };

  const startEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description
    });
    setEditingCategory(category);
  };

  const startEditTag = (tag: Tag) => {
    setTagForm({
      name: tag.name,
      description: tag.description
    });
    setEditingTag(tag);
  };

  const startEditProperty = (property: Property) => {
    setPropertyForm({
      name: property.name,
      source: property.source
    });
    setEditingProperty(property);
  };

  const startEditUse = (use: Use) => {
    setUseForm({
      name: use.name,
      source: use.source
    });
    setEditingUse(use);
  };

  const startEditProtocol = (protocol: ProtocolWithItems) => {
    setProtocolForm({
      name: protocol.name,
      description: protocol.description,
      item_ids: protocol.items.map((item: NaturalHealingItemWithRelations) => item.id)
    });
    setEditingProtocol(protocol);
  };

  // Form handlers - Create/Update
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.category_id) return;
    
    setIsLoading(true);
    try {
      if (editingItem) {
        await trpc.updateNaturalHealingItem.mutate({
          id: editingItem.id,
          ...itemForm
        });
      } else {
        await trpc.createNaturalHealingItem.mutate(itemForm);
      }
      await loadItems();
      resetItemForm();
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingCategory) {
        await trpc.updateCategory.mutate({
          id: editingCategory.id,
          ...categoryForm
        });
      } else {
        await trpc.createCategory.mutate(categoryForm);
      }
      await loadCategories();
      resetCategoryForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingTag) {
        await trpc.updateTag.mutate({
          id: editingTag.id,
          ...tagForm
        });
      } else {
        await trpc.createTag.mutate(tagForm);
      }
      await loadTags();
      resetTagForm();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingProperty) {
        await trpc.updateProperty.mutate({
          id: editingProperty.id,
          ...propertyForm
        });
      } else {
        await trpc.createProperty.mutate(propertyForm);
      }
      await loadProperties();
      resetPropertyForm();
    } catch (error) {
      console.error('Failed to save property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitUse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUse) {
        await trpc.updateUse.mutate({
          id: editingUse.id,
          ...useForm
        });
      } else {
        await trpc.createUse.mutate(useForm);
      }
      await loadUses();
      resetUseForm();
    } catch (error) {
      console.error('Failed to save use:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingProtocol) {
        await trpc.updateProtocol.mutate({
          id: editingProtocol.id,
          ...protocolForm
        });
      } else {
        await trpc.createProtocol.mutate(protocolForm);
      }
      await loadProtocols();
      resetProtocolForm();
    } catch (error) {
      console.error('Failed to save protocol:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteItem = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteNaturalHealingItem.mutate(id);
      await loadItems();
      await loadProtocols(); // Refresh protocols in case they referenced this item
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCategory.mutate(id);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTag.mutate(id);
      await loadTags();
      await loadItems(); // Refresh items to update tag associations
    } catch (error) {
      console.error('Failed to delete tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteProperty.mutate(id);
      await loadProperties();
      await loadItems(); // Refresh items to update property associations
    } catch (error) {
      console.error('Failed to delete property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUse = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteUse.mutate(id);
      await loadUses();
      await loadItems(); // Refresh items to update use associations
    } catch (error) {
      console.error('Failed to delete use:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProtocol = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteProtocol.mutate(id);
      await loadProtocols();
    } catch (error) {
      console.error('Failed to delete protocol:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle handlers for checkboxes
  const handleTagToggle = (tagId: number, checked: boolean) => {
    setItemForm((prev: CreateNaturalHealingItemInput) => ({
      ...prev,
      tag_ids: checked 
        ? [...(prev.tag_ids || []), tagId]
        : (prev.tag_ids || []).filter((id: number) => id !== tagId)
    }));
  };

  const handlePropertyToggle = (propertyId: number, checked: boolean) => {
    setItemForm((prev: CreateNaturalHealingItemInput) => ({
      ...prev,
      property_ids: checked 
        ? [...(prev.property_ids || []), propertyId]
        : (prev.property_ids || []).filter((id: number) => id !== propertyId)
    }));
  };

  const handleUseToggle = (useId: number, checked: boolean) => {
    setItemForm((prev: CreateNaturalHealingItemInput) => ({
      ...prev,
      use_ids: checked 
        ? [...(prev.use_ids || []), useId]
        : (prev.use_ids || []).filter((id: number) => id !== useId)
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="items">🌱 Items</TabsTrigger>
            <TabsTrigger value="protocols">📋 Protocols</TabsTrigger>
            <TabsTrigger value="properties">⚡ Properties</TabsTrigger>
            <TabsTrigger value="uses">💊 Uses</TabsTrigger>
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

            {/* Add/Edit Item Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingItem ? '✏️ Edit Item' : '➕ Add New Item'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitItem} className="space-y-4">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Properties</Label>
                      <ScrollArea className="h-32 w-full border rounded p-2 mt-2">
                        <div className="space-y-2">
                          {properties.map((property: Property) => (
                            <div key={property.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`property-${property.id}`}
                                checked={(itemForm.property_ids || []).includes(property.id)}
                                onCheckedChange={(checked: boolean) => handlePropertyToggle(property.id, checked)}
                              />
                              <Label htmlFor={`property-${property.id}`} className="text-xs">
                                {property.name} {property.source && `(${property.source})`}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div>
                      <Label>Uses</Label>
                      <ScrollArea className="h-32 w-full border rounded p-2 mt-2">
                        <div className="space-y-2">
                          {uses.map((use: Use) => (
                            <div key={use.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`use-${use.id}`}
                                checked={(itemForm.use_ids || []).includes(use.id)}
                                onCheckedChange={(checked: boolean) => handleUseToggle(use.id, checked)}
                              />
                              <Label htmlFor={`use-${use.id}`} className="text-xs">
                                {use.name} {use.source && `(${use.source})`}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <ScrollArea className="h-32 w-full border rounded p-2 mt-2">
                        <div className="space-y-2">
                          {tags.map((tag: Tag) => (
                            <div key={tag.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag.id}`}
                                checked={(itemForm.tag_ids || []).includes(tag.id)}
                                onCheckedChange={(checked: boolean) => handleTagToggle(tag.id, checked)}
                              />
                              <Label htmlFor={`tag-${tag.id}`} className="text-xs">
                                {tag.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingItem ? '💾 Update Item' : '✨ Create Item')}
                    </Button>
                    {editingItem && (
                      <Button type="button" variant="outline" onClick={resetItemForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
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
                    {item.properties.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700">🌟 Properties</h4>
                        <div className="flex flex-wrap gap-1">
                          {item.properties.map((property: Property) => (
                            <Badge key={property.id} variant="outline" className="text-xs">
                              {property.name} {property.source && `(${property.source})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.uses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-700">💊 Uses</h4>
                        <div className="flex flex-wrap gap-1">
                          {item.uses.map((use: Use) => (
                            <Badge key={use.id} variant="outline" className="text-xs">
                              {use.name} {use.source && `(${use.source})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => startEditItem(item)}>
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{item.name}" and remove it from all protocols.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            {/* Add/Edit Protocol Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingProtocol ? '✏️ Edit Protocol' : '➕ Create New Protocol'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitProtocol} className="space-y-4">
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingProtocol ? '💾 Update Protocol' : '📋 Create Protocol')}
                    </Button>
                    {editingProtocol && (
                      <Button type="button" variant="outline" onClick={resetProtocolForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
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
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => loadProtocolById(protocol.id)}
                        className="flex-1"
                      >
                        📊 View Analysis
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startEditProtocol(protocol)}
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the protocol "{protocol.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProtocol(protocol.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
                              {selectedProtocol.aggregated_metadata.common_properties.map((property: Property) => (
                                <Badge key={property.id} variant="outline" className="text-xs">
                                  {property.name} {property.source && `(${property.source})`}
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
                              {selectedProtocol.aggregated_metadata.common_uses.map((use: Use) => (
                                <Badge key={use.id} variant="outline" className="text-xs">
                                  {use.name} {use.source && `(${use.source})`}
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

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingProperty ? '✏️ Edit Property' : '➕ Add New Property'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitProperty} className="space-y-4">
                  <div>
                    <Label htmlFor="property-name">Property Name</Label>
                    <Input
                      id="property-name"
                      value={propertyForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPropertyForm((prev: CreatePropertyInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="property-source">Source (optional)</Label>
                    <Input
                      id="property-source"
                      value={propertyForm.source || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPropertyForm((prev: CreatePropertyInput) => ({ 
                          ...prev, 
                          source: e.target.value || null 
                        }))
                      }
                      placeholder="e.g., Clinical study 2023, Traditional medicine"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingProperty ? '💾 Update Property' : '⚡ Create Property')}
                    </Button>
                    {editingProperty && (
                      <Button type="button" variant="outline" onClick={resetPropertyForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property: Property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>⚡ {property.name}</span>
                    </CardTitle>
                    {property.source && (
                      <CardDescription>Source: {property.source}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEditProperty(property)}>
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{property.name}" and remove it from all items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProperty(property.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="uses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingUse ? '✏️ Edit Use' : '➕ Add New Use'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitUse} className="space-y-4">
                  <div>
                    <Label htmlFor="use-name">Use Name</Label>
                    <Input
                      id="use-name"
                      value={useForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUseForm((prev: CreateUseInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="use-source">Source (optional)</Label>
                    <Input
                      id="use-source"
                      value={useForm.source || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUseForm((prev: CreateUseInput) => ({ 
                          ...prev, 
                          source: e.target.value || null 
                        }))
                      }
                      placeholder="e.g., Folk medicine, Research study"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingUse ? '💾 Update Use' : '💊 Create Use')}
                    </Button>
                    {editingUse && (
                      <Button type="button" variant="outline" onClick={resetUseForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uses.map((use: Use) => (
                <Card key={use.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>💊 {use.name}</span>
                    </CardTitle>
                    {use.source && (
                      <CardDescription>Source: {use.source}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEditUse(use)}>
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{use.name}" and remove it from all items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUse(use.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitCategory} className="space-y-4">
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingCategory ? '💾 Update Category' : '🏷️ Create Category')}
                    </Button>
                    {editingCategory && (
                      <Button type="button" variant="outline" onClick={resetCategoryForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {items.filter((item: NaturalHealingItemWithRelations) => item.category_id === category.id).length} items
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEditCategory(category)}>
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{category.name}". Note: Categories with associated items cannot be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTag ? '✏️ Edit Tag' : '➕ Add New Tag'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTag} className="space-y-4">
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : (editingTag ? '💾 Update Tag' : '🔖 Create Tag')}
                    </Button>
                    {editingTag && (
                      <Button type="button" variant="outline" onClick={resetTagForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        {items.filter((item: NaturalHealingItemWithRelations) => 
                          item.tags.some((itemTag: Tag) => itemTag.id === tag.id)
                        ).length} items
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEditTag(tag)}>
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{tag.name}" and remove it from all items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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