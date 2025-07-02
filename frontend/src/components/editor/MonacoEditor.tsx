import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Drawer,
  List,
  ListItem,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Send as SendIcon,
  Code as CodeIcon,
  AutoFixHigh as AutoFixIcon,
  Help as HelpIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  width?: string;
  theme?: string;
  readOnly?: boolean;
}

interface AICompletion {
  text: string;
  confidence: number;
  type: 'completion' | 'suggestion' | 'refactor' | 'explanation';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'python',
  height = '400px',
  width = '100%',
  theme = 'vs-dark',
  readOnly = false,
}) => {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiModel, setAiModel] = useState('chatgpt');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [selectedText, setSelectedText] = useState('');

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);

    // Track selection
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel().getValueInRange(selection);
      setSelectedText(selectedText);
    });

    // Register AI completion provider
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: async (model: any, position: any) => {
        try {
          const textBeforeCursor = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const suggestions = await getAICompletions(textBeforeCursor, language);
          
          return {
            suggestions: suggestions
              .filter(suggestion => typeof suggestion.text === 'string')
              .map((suggestion, index) => ({
                label: `🤖 ${suggestion.text.substring(0, 50)}...`,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: suggestion.text,
                detail: `AI Suggestion (${typeof suggestion.confidence === 'number' && suggestion.confidence.toFixed ? suggestion.confidence.toFixed(1) : ''}% confidence)`,
                documentation: suggestion.text,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
                sortText: `0${index}`,
              })),
          };
        } catch (error) {
          console.error('AI completion error:', error);
          return { suggestions: [] };
        }
      },
    });

    // Register AI hover provider
    monaco.languages.registerHoverProvider(language, {
      provideHover: async (model: any, position: any) => {
        try {
          const word = model.getWordAtPosition(position);
          if (word) {
            const explanation = await getAIExplanation(word.word, language);
            return {
              contents: [
                { value: `**AI Explanation:** ${explanation}` },
              ],
            };
          }
        } catch (error) {
          console.error('AI hover error:', error);
        }
        return null;
      },
    });
  };

  const getAICompletions = async (context: string, lang: string): Promise<AICompletion[]> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: context,
          language: lang,
          model: aiModel,
          max_tokens: 100,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return [
          {
            text: data.completion,
            confidence: 0.85,
            type: 'completion',
          },
        ];
      }
    } catch (error) {
      console.error('AI completion request failed:', error);
    }

    // Fallback suggestions
    return [
      {
        text: '// TODO: Implement this function',
        confidence: 0.7,
        type: 'suggestion',
      },
      {
        text: 'console.log("Debug:", variable);',
        confidence: 0.6,
        type: 'suggestion',
      },
    ];
  };

  const getAIExplanation = async (word: string, lang: string): Promise<string> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          term: word,
          language: lang,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.explanation;
      }
    } catch (error) {
      console.error('AI explanation request failed:', error);
    }

    return `AI explanation for "${word}" not available.`;
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: chatInput,
          context: value,
          language: language,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AI chat request failed:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: chatInput,
          language: language,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onChange(data.code);
        setChatInput('');
      }
    } catch (error) {
      console.error('AI generation request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIRefactor = async () => {
    if (!selectedText.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8001'}/ai/refactor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: selectedText,
          language: language,
          model: aiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace selected text with refactored code
        if (editorInstance) {
          const selection = editorInstance.getSelection();
          editorInstance.executeEdits('ai-refactor', [{
            range: selection,
            text: data.refactored_code,
          }]);
        }
      }
    } catch (error) {
      console.error('AI refactor request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleAIChat();
    }
  };

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Main Editor */}
      <Editor
        height={height}
        width={width}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly: readOnly,
          scrollBeyondLastLine: false,
          roundedSelection: false,
          selectOnLineNumbers: true,
          cursorStyle: 'line',
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          hover: { enabled: true },
          contextmenu: true,
          find: { addExtraSpaceOnTop: false },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          links: true,
          colorDecorators: true,
        }}
      />

      {/* AI Assistant Floating Button */}
      <Fab
        color="primary"
        aria-label="AI Assistant"
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => setAiChatOpen(true)}
      >
        <AIIcon />
      </Fab>

      {/* AI Chat Drawer */}
      <Drawer
        anchor="right"
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            p: 2,
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AIIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              AI Assistant
            </Typography>
            <IconButton onClick={() => setAiChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Model Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Model</InputLabel>
            <Select
              value={aiModel}
              label="AI Model"
              onChange={(e) => setAiModel(e.target.value)}
            >
              <MenuItem value="chatgpt">ChatGPT</MenuItem>
              <MenuItem value="claude">Claude</MenuItem>
              <MenuItem value="gemini">Gemini</MenuItem>
              <MenuItem value="deepseek">DeepSeek</MenuItem>
            </Select>
          </FormControl>

          {/* Quick Actions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<CodeIcon />}
                label="Generate"
                onClick={handleAIGenerate}
                disabled={isLoading}
                size="small"
              />
              <Chip
                icon={<AutoFixIcon />}
                label="Refactor"
                onClick={handleAIRefactor}
                disabled={!selectedText.trim() || isLoading}
                size="small"
              />
              <Chip
                icon={<HelpIcon />}
                label="Explain"
                onClick={() => {
                  if (selectedText.trim()) {
                    setChatInput(`Explain this code: ${selectedText}`);
                  }
                }}
                disabled={!selectedText.trim()}
                size="small"
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Chat Messages */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            {chatMessages.length === 0 ? (
              <Alert severity="info">
                Start a conversation with AI to get help with your code!
              </Alert>
            ) : (
              <List>
                {chatMessages.map((message, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {message.role === 'user' ? (
                        <Chip label="You" size="small" color="primary" />
                      ) : (
                        <Chip label="AI" size="small" color="secondary" />
                      )}
                      <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </ListItem>
                ))}
                {isLoading && (
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2">AI is thinking...</Typography>
                    </Box>
                  </ListItem>
                )}
              </List>
            )}
          </Box>

          {/* Chat Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ask AI for help with your code..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton
              onClick={handleAIChat}
              disabled={!chatInput.trim() || isLoading}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Box>

          <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
            Press Ctrl+Enter to send message
          </Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

export default MonacoEditor; 