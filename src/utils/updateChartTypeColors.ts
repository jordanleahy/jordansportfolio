import { supabase } from '@/integrations/supabase/client';

export async function updateChartTypeColors() {
  try {
    // Get the default color theme
    const { data: defaultTheme, error: themeError } = await supabase
      .from('color_themes')
      .select('*')
      .eq('is_default', true)
      .single();

    if (themeError || !defaultTheme) {
      throw new Error('Failed to fetch default color theme');
    }

    console.log('🎨 Using default theme:', defaultTheme);

    // Call the edge function to update chart-type system prompts with the default theme
    const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: {
        category: 'chart-type',
        user_id: (await supabase.auth.getUser()).data.user?.id,
        color_theme: defaultTheme
      }
    });

    if (error) {
      throw error;
    }

    console.log('✅ Chart-type colors updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to update chart-type colors:', error);
    throw error;
  }
}