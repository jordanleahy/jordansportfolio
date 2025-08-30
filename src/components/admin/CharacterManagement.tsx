import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Filter,
  Grid,
  List,
  Loader2
} from 'lucide-react';
import { logger } from '@/services/logger';

interface Character {
  id: string;
  character_name: string;
  character_description: string;
  character_type: string; // Changed from union type to string for database compatibility
  seed: string;
  sample_image_url: string;
  created_at: string;
  user_id: string;
}

interface CharacterGeneration {
  id: string;
  user_prompt: string;
  generated_image_url: string;
  created_at: string;
  character_type: string; // Changed from union type to string for database compatibility
}

export const CharacterManagement: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterGenerations, setCharacterGenerations] = useState<CharacterGeneration[]>([]);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      logger.error('Error loading characters', error);
      toast.error('Failed to load characters');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCharacterGenerations = async (characterId: string) => {
    try {
      const { data, error } = await supabase
        .from('character_generations')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacterGenerations(data || []);
    } catch (error) {
      logger.error('Error loading character generations', error);
      toast.error('Failed to load character generations');
    }
  };

  const deleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;
      
      setCharacters(characters.filter(char => char.id !== characterId));
      toast.success('Character deleted successfully');
    } catch (error) {
      logger.error('Error deleting character', error);
      toast.error('Failed to delete character');
    }
  };

  const downloadImage = (imageUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      logger.error('Download error', error);
      toast.error('Failed to download image');
    }
  };

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.character_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.character_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || character.character_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pixar': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vector': return 'bg-green-100 text-green-800 border-green-200';
      case 'realistic': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const CharacterCard = ({ character }: { character: Character }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg truncate">{character.character_name}</CardTitle>
          <Badge className={`text-xs ${getTypeColor(character.character_type)}`}>
            {character.character_type}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {character.character_description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-square relative overflow-hidden rounded-md border">
          <img
            src={character.sample_image_url}
            alt={character.character_name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Created: {new Date(character.created_at).toLocaleDateString()}</div>
          {character.seed && (
            <div className="font-mono">Seed: {character.seed.substring(0, 20)}...</div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCharacter(character);
              loadCharacterGenerations(character.id);
            }}
            className="flex-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadImage(
              character.sample_image_url, 
              `character-${character.character_type}-${character.id}.png`
            )}
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteCharacter(character.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Character Management</h2>
        <p className="text-muted-foreground">
          View and manage all generated characters in your system
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search characters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="pixar">Pixar</option>
                <option value="vector">Vector</option>
                <option value="realistic">Realistic</option>
              </select>
            </div>

            <div className="flex border rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Characters Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading characters...</span>
        </div>
      ) : filteredCharacters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Characters Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all' 
                ? 'No characters match your current filters.' 
                : 'No characters have been created yet.'}
            </p>
            {(searchQuery || typeFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredCharacters.map(character => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}

      {/* Character Detail Modal */}
      {selectedCharacter && (
        <Card className="fixed inset-4 z-50 overflow-auto bg-background border shadow-lg">
          <CardHeader className="sticky top-0 bg-background border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedCharacter.character_name}</CardTitle>
                <CardDescription>{selectedCharacter.character_description}</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedCharacter(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Original Character</h4>
                  <img
                    src={selectedCharacter.sample_image_url}
                    alt={selectedCharacter.character_name}
                    className="w-full rounded-lg border"
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Character Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {selectedCharacter.character_type}</div>
                    <div><strong>Seed:</strong> <code className="bg-muted px-2 py-1 rounded">{selectedCharacter.seed}</code></div>
                    <div><strong>Created:</strong> {new Date(selectedCharacter.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {characterGenerations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">All Generations ({characterGenerations.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {characterGenerations.map(generation => (
                      <div key={generation.id} className="border rounded-lg p-4">
                        <img
                          src={generation.generated_image_url}
                          alt={generation.user_prompt}
                          className="w-full aspect-square object-cover rounded-md mb-3"
                        />
                        <div className="text-sm space-y-1">
                          <div><strong>Prompt:</strong> {generation.user_prompt}</div>
                          <div><strong>Created:</strong> {new Date(generation.created_at).toLocaleDateString()}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(
                            generation.generated_image_url,
                            `generation-${generation.id}.png`
                          )}
                          className="w-full mt-2"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};