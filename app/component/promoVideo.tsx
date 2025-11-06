import React, {useState, useCallback} from 'react';
import {MediaCard, VideoThumbnail, Modal} from '@shopify/polaris';

function PromoVideo() {
  const [active, setActive] = useState(false);
  const handleChange = useCallback(() => setActive((active) => !active), []);

  return (
    <>
      <style>{`
        .Polaris-VideoThumbnail__Thumbnail {
          position: relative;
          width: 100%;
          height: 100%;
          background-size: contain !important; /* Show entire image */
          background-position: center center !important;
          background-repeat: no-repeat;
          background-color: #f6f6f7; /* Add background color for empty space */
        }
      `}</style>
      <MediaCard
        title="Turn your side-project into a business"
        primaryAction={{
          content: 'Learn more',
          onAction: () => {},
        }}
        description={`In this course, you'll learn how the Kular family turned their mom's recipe book into a global business.`}
        popoverActions={[{content: 'Dismiss', onAction: () => {}}]}
      >
        <VideoThumbnail
          videoLength={80}
          thumbnailUrl="../assets/thumb4.png"
          onClick={handleChange}
        />
      </MediaCard>

      <Modal
        open={active}
        onClose={handleChange}
        title="Ecom Speed Experts"
      
      >
        <div style={{position: 'relative', paddingBottom: '56.25%', height: 10}}>
          <iframe
            src="https://www.youtube.com/embed/zSCrmsgE0BA?autoplay=1"
            title="YouTube video player"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </Modal>
    </>
  );
}

export default PromoVideo;