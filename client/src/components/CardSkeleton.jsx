import { Card, CardContent, Skeleton, Grid, Box } from "@mui/material";

function CardSkeleton({ count = 6, type = "default" }) {
  return (
    <Grid container spacing={3}>
      {[...Array(count)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            {type === "photo" && (
              <Skeleton variant="rectangular" height={200} />
            )}
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                {type !== "photo" && (
                  <Skeleton
                    variant="circular"
                    width={24}
                    height={24}
                    sx={{ mr: 1 }}
                  />
                )}
                <Skeleton variant="text" width="70%" height={30} />
              </Box>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="50%" />
              <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
export default CardSkeleton;