import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import CardSkeleton from "../components/CardSkeleton";
import { useEffect } from "react";
import { albumService } from "../services/albumService";

function Albums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Create album
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateAlbum = async () => {
    if (!formData.name) {
      setError("Please provide an album name");
      return;
    }

    try {
      // Set loading state
      setLoading(true);
      // Call albumService.create with formData object
      await albumService.create(formData);
      // Reset form
      setFormData({
        name: "",
        description: "",
      });
      // Close dialog
      setCreateDialogOpen(false);
      // Refresh albums list
      fetchAlbums();
    } catch (err) {
      setError(
        err.message || err.response?.data?.message || "Failed to create album",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch albums
  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const data = await albumService.getAll();
      setAlbums(data);
      setError("");
    } catch (err) {
      setError(
        err.message || err.response?.data?.message || "Failed to load albums",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await albumService.delete(id);
      fetchAlbums();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Delete failed");
    }
  };

  // Render the album
  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4">Albums</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="small"
        >
          Create Album
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CardSkeleton count={6} />
      ) : albums.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <DescriptionIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No albums found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first album to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {albums.map((album) => (
            <Grid item xs={12} sm={6} md={4} key={album._id}>
              <Card>
                <CardContent>
                  {album.photos && album.photos.length > 0 ? (
                    <Box
                      component="img"
                      src={
                        album.photos[0].thumbnailURL || album.photos[0].imageURL
                      }
                      alt={album.name}
                      sx={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: 1,
                        mb: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 200,
                        backgroundColor: "grey.200",
                        borderRadius: 1,
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography color="text.secondary">
                        No photos yet
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="h6" noWrap>
                    {album.name}
                  </Typography>

                  {album.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {album.description}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    color="primary.main"
                    sx={{ mt: 1 }}
                  >
                    {album.photos?.length || 0} photos
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {new Date(album.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>

                <CardActions>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(album._id, album.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create Album</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Album Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description (optional)"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAlbum}
            variant="contained"
            disabled={!formData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Albums;
