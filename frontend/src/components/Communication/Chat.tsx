import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Paper, Typography, TextField, Button, List, ListItem, ListItemText, Divider, Avatar } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { consultationsApi } from '../../services/api'
import type { Message } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const Chat: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslate()

  const storageKey = useMemo(() => `messages_${consultationId}`, [consultationId])

  useEffect(() => {
    if (!consultationId) return
    consultationsApi.listMessages(consultationId)
      .then((raw) => {
        const parsed: Message[] = raw.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
        setMessages(parsed)
      })
      .catch((error) => {
        console.error('Failed to load messages:', error)
      })
  }, [storageKey, consultationId])

  useEffect(() => {
    // auto-scroll to bottom
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !consultationId || !user) return
    try {
      const newMsg = await consultationsApi.sendMessage(consultationId, input.trim())
      setMessages((current) => [...current, { ...newMsg, timestamp: new Date(newMsg.timestamp) }])
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5">{t('Consultation Chat')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Chat with your appointed doctor in real-time')}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, height: { xs: 350, md: 500 }, display: 'flex', flexDirection: 'column' }}>
        <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto' }}>
          <List>
            {messages.map(m => (
              <React.Fragment key={m.id}>
                <ListItem sx={{ justifyContent: m.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
                  {m.senderId !== user?.id && (
                    <Avatar sx={{ mr: 1 }}>{m.senderName.charAt(0)}</Avatar>
                  )}
                  <ListItemText
                    primary={m.content}
                    secondary={`${m.senderName} • ${new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(m.timestamp))}`}
                    sx={{
                      maxWidth: '70%',
                      bgcolor: m.senderId === user?.id ? 'primary.light' : 'grey.100',
                      color: 'text.primary',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5
                    }}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('Type your message...')}
            fullWidth
            size="small"
          />
          <Button variant="contained" onClick={sendMessage}>{t('Send')}</Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default Chat
