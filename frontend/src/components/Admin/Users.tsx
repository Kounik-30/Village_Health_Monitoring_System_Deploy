import React, { useEffect, useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material'
import { usersApi } from '../../services/api'
import type { User } from '../../types/models'
import { useTranslate } from '../../hooks/useTranslate'

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true) // loading is used to show empty state text; keep for future enhancement
  const { t, language } = useTranslate()

  useEffect(() => {
    usersApi.list()
      .then((stored) => {
        const usersWithDates = stored.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt || Date.now()),
        lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
        isActive: u.isActive !== false
        }))
        setUsers(usersWithDates)
      })
      .catch((e) => {
        console.error('Failed to load users', e)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u)
    setUsers(updatedUsers)
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getFilteredUsers = () => {
    switch (activeTab) {
      case 0: return users
      case 1: return users.filter(u => u.role === 'villager')
      case 2: return users.filter(u => u.role === 'doctor')
      case 3: return users.filter(u => !u.isActive)
      default: return users
    }
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          {t('Admin - Users')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('Manage registered users and their access status')}
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label={`${t('All Users')} (${users.length})`} />
          <Tab label={`${t('Villagers')} (${users.filter(u => u.role === 'villager').length})`} />
          <Tab label={`${t('Doctors')} (${users.filter(u => u.role === 'doctor').length})`} />
          <Tab label={`${t('Inactive')} (${users.filter(u => !u.isActive).length})`} />
        </Tabs>

         {loading && (
           <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
             {t('Loading users...')}
           </Typography>
         )}

         <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('Name')}</TableCell>
                <TableCell>{t('Email')}</TableCell>
                <TableCell>{t('Role')}</TableCell>
                <TableCell>{t('Status')}</TableCell>
                <TableCell>{t('Created')}</TableCell>
                <TableCell align="right">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredUsers().map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{user.fullName}</Typography>
                      {user.village && (
                        <Typography variant="caption" color="text.secondary">{user.village}</Typography>
                      )}
                      {user.specialization && (
                        <Typography variant="caption" color="text.secondary">{user.specialization}</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={t(user.role)} 
                      size="small" 
                      color={user.role === 'doctor' ? 'primary' : user.role === 'admin' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.isActive ? t('Active') : t('Inactive')}
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(user.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant={user.isActive ? 'outlined' : 'contained'}
                      color={user.isActive ? 'error' : 'success'}
                      size="small"
                      onClick={() => handleToggleUserStatus(user.id)}
                    >
                      {user.isActive ? t('Deactivate') : t('Activate')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}

export default Users
