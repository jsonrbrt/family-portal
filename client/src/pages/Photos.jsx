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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import Layout from "../components/Layout";
import CardSkeleton from "../components/CardSkeleton";
import { photoService } from "../services/photoService";
import { albumService } from "../services/albumService";
import { useEffect } from "react";

function Photos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [uploadData, setUploadData] = useState({
    file: null,
    name: "",
    description: "",
    tags: "",
    albumId: "",
  });

  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getAll();
      setPhotos(data);
      setError("");
    } catch (err) {
      setError(
        err.message || err.response?.data?.message || "Failed to load photos",
      );
    } finally {
      setLoading(false);
    }
  };

  const [albums, setAlbums] = useState([]);

  const fetchAlbums = async () => {
    try {
      const data = await albumService.getAll();
      setAlbums(data);
    } catch (err) {
      console.error("Failed to load albums:", err);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, []);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        name: file.name,
      });
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadData.file) {
      setError("Please select a file");
      return;
    }

    // Validate file size
    if (uploadData.file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(uploadData.file.type)) {
      setError("Invalid file type. Only JPG and PNG allowed.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("name", uploadData.name);
      formData.append("description", uploadData.description);
      formData.append("tags", uploadData.tags);
      formData.append("albumId", uploadData.albumId);

      // Only append albumId if it's selected
      if (uploadData.albumId) {
        formData.append("albumId", uploadData.albumId);
      }

      await photoService.upload(formData);

      // Reset form
      setUploadData({
        file: null,
        name: "",
        description: "",
        tags: "",
        albumId: ""
      });
      setUploadDialogOpen(false);
      // Refresh photos list
      fetchPhotos();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await photoService.delete(id);
      fetchPhotos();
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Delete failed");
    }
  };

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
        <Typography variant="h4">Photos</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          size="small"
        >
          Upload Photo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CardSkeleton count={6} type="photo" />
      ) : photos.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <DescriptionIcon
              sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No photos found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your first photo to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo._id}>
              <Card>
                <CardContent>
                  <Box
                    component="img"
                    src={photo.thumbnailURL || photo.imageURL}
                    alt={photo.name}
                    sx={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                  <Typography variant="h6" noWrap>
                    {photo.name}
                  </Typography>

                  {photo.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {photo.description}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </Typography>

                  {photo.tags && photo.tags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {photo.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(photo._id, photo.name)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Upload Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              {uploadData.file ? uploadData.file.name : "Choose file"}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".jpg, .jpeg, .png"
              />
            </Button>

            <TextField
              fullWidth
              label="Photo Name"
              value={uploadData.name}
              onChange={(e) =>
                setUploadData({ ...uploadData, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description (optional)"
              multiline
              rows={3}
              value={uploadData.description}
              onChange={(e) =>
                setUploadData({ ...uploadData, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Album (optional)"
              value={uploadData.albumId}
              onChange={(e) =>
                setUploadData({ ...uploadData, albumId: e.target.value })
              }
              sx={{ mb: 2 }}
            >
              <MenuItem value="">None</MenuItem>
              {albums.map((album) => (
                <MenuItem key={album._id} value={album._id}>
                  {album.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Tags (comma separated, optional)"
              value={uploadData.tags}
              onChange={(e) =>
                setUploadData({ ...uploadData, tags: e.target.value })
              }
              helperText="e.g., holiday, hawaii, 2023"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={uploading || !uploadData.file}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Photos;
