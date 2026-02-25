import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Container,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

function Family() {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    try {
      setLoading(true);
      const response = await api.get("/families/my-family");
      setFamily(response.data);
    } catch (err) {
      setError(
        err.message || err.response?.data?.message || "Failed to load family",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(family.inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const isAdmin = (memberId) => {
    return family?.admins?.some((admin) => admin._id === memberId);
  };

  if (loading) {
    return (
      <Layout>
        <Typography>Loading...</Typography>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error">{error}</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="sm" sx={{ ml: 0 }}>
        <Typography variant="h4" gutterBottom>
          Family
        </Typography>

        {/* Family info card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {family?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {family?.members?.length || 0} member
            {family?.members?.length !== 1 ? "s" : ""}
          </Typography>
        </Paper>

        {/* Invite code card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Invite Family Members</Typography>
            <PersonAddIcon color="primary" />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this invite code with family members so they can join:
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                flexGrow: 1,
                bgcolor: "grey.50",
                fontFamily: "monospace",
                fontSize: "1.25rem",
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: 2,
              }}
            >
              {family?.inviteCode}
            </Paper>

            <Tooltip title={copySuccess ? "Copied!" : "Copy invite code"}>
              <Button
                variant="contained"
                startIcon={<CopyIcon />}
                onClick={handleCopyInviteCode}
                color={copySuccess ? "success" : "primary"}
              >
                {copySuccess ? "Copied" : "Copy"}
              </Button>
            </Tooltip>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            New members can use this code during registration or in their
            account settings to join your family.
          </Alert>
        </Paper>

        {/* Members list */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Family Members
          </Typography>

          <List>
            {family?.members?.map((member, index) => (
              <Box key={member._id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: isAdmin(member._id)
                          ? "primary.main"
                          : "secondary.main ",
                      }}
                    >
                      {member.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box component="span">
                          {member.name}
                          {member._id === user._id && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{ mb: 0.25, ml: 0.7 }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={member.email}
                  />
                  <Chip
                    icon={isAdmin(member._id) ? <AdminIcon /> : <PersonIcon />}
                    label={isAdmin(member._id) ? "Admin" : "Member"}
                    color={isAdmin(member._id) ? "primary" : "default"}
                    size="small"
                  />
                </ListItem>
                {index < family.members.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        </Paper>
      </Container>
    </Layout>
  );
}

export default Family;
