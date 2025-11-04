// utils/emailTemplates.ts

export function cancellationEmailTemplate({
    shopName,
    planName,
    cancelDate,
    username,
  }: {
    shopName: string;
    planName: string;
    cancelDate?: string;
    username?: string;
  }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We're Sorry to See You Go</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Open Sans', sans-serif; background-color: #f5f5f5; color: #000; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: #97ba52; background: linear-gradient(135deg, #97ba52 0%, #7a9442 100%); color: white; padding: 40px 30px; text-align: center; position: relative;">
              <!--[if gte mso 9]>
              <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                <v:fill type="gradient" color="#97ba52" color2="#7a9442" angle="135" />
              </v:background>
              <![endif]-->
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Ecom_Speed_Expert_1.png?v=1761657122" alt="Ecom Speed Expert Logo" style="height: 60px; border-radius: 8px;">
                <span style="font-size: 28px; margin: 0 15px; font-weight: 700;">×</span>
                <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Shopify_logo_1.png?v=1761659987" alt="Shopify Logo" style="height: 60px; border-radius: 8px;">
              </div>
              <h1 style="font-family: 'Poppins', sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 10px;">We're Sorry to See You Go</h1>
              <p style="font-size: 18px; opacity: 0.9;">Thank you for giving Ecom Speed Expert a try</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <!-- Message Box -->
              <div style="background: #f8f9fa; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #97ba52;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #000; margin-bottom: 15px;">Hi ${username},</h2>
                <p style="font-size: 16px; color: #666; margin-bottom: 15px;">We noticed you've [ACTION_TAKEN] your subscription. We're sorry to see you go and want to make sure you have the best possible experience with your store, whether you're using our app or not.</p>
                <p style="font-size: 16px; color: #666; margin-bottom: 15px;">As Official Shopify Partners, we're committed to helping merchants like you succeed. If you're not satisfied with our service, we'd love to help make things right.</p>
              </div>
              
              <!-- Special Offer Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">🎁</span> Our Special Offer for You
                </h2>
                <div style="background: #97ba52; background: linear-gradient(135deg, #97ba52 0%, #7a9442 100%); color: white; border-radius: 12px; padding: 25px; margin-bottom: 30px; text-align: center;">
                  <!--[if gte mso 9]>
                  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                    <v:fill type="gradient" color="#97ba52" color2="#7a9442" angle="135" />
                  </v:background>
                  <![endif]-->
                  <h3 style="font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 600; margin-bottom: 15px;">Let Us Manually Optimize Your Theme - FREE!</h3>
                  <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">Not satisfied with automated optimization? Our expert team will manually edit your theme code to improve your store's performance.</p>
                  <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 16px; font-size: 18px; font-weight: 700; margin-bottom: 20px;">Value: $299</div>
                  <p style="font-size: 16px; margin-bottom: 20px; opacity: 0.95;">This one-time service includes:</p>
                  
                  <!-- Offer Items -->
                  <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: flex-start; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: white; color: #97ba52; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: white;">Manual Code Optimization</h4>
                        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0;">Our developers will personally optimize your theme's code for maximum speed</p>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: white; color: #97ba52; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: white;">Performance Audit</h4>
                        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0;">Comprehensive analysis of your store's speed bottlenecks</p>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: white; color: #97ba52; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: white;">Image & Asset Optimization</h4>
                        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0;">Optimize all images and assets without losing quality</p>
                      </div>
                    </div>
                  </div>
                  
                  <a href="https://booststar.in/pages/contact-us" style="display: inline-block; padding: 14px 24px; background-color: white; color: #97ba52; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', sans-serif;">Schedule Free Optimization</a>
                </div>
              </div>
              
              <!-- Changed Your Mind Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">↩</span> Changed Your Mind?
                </h2>
                
                <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
                  <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                    <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                    <div>
                      <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">50% Off Your Next 3 Months</h4>
                      <p style="font-size: 14px; color: #666; margin: 0;">Come back within 30 days and get half price for 3 months</p>
                    </div>
                  </div>
                  
                  <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                    <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                    <div>
                      <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Keep Free Plan Active</h4>
                      <p style="font-size: 14px; color: #666; margin: 0;">Continue optimizing your home page for free, forever</p>
                    </div>
                  </div>
                </div>
                
                <a href="[REACTIVATE_URL]" style="display: inline-block; padding: 14px 24px; background-color: #97ba52; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', sans-serif;">Reactivate Your Plan</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <h3 style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Need to Talk to Our Team?</h3>
              <p style="margin-bottom: 20px; color: #666;">We're here to help you succeed. Reach out anytime with questions or concerns.</p>
              
              <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; font-size: 14px; color: #666;">
                  <span style="color: #97ba52; margin-right: 8px;">✉</span>
                  <span>support@ecomspeedexpert.com</span>
                </div>
                <div style="display: flex; align-items: center; font-size: 14px; color: #666;">
                  <span style="color: #97ba52; margin-right: 8px;">📞</span>
                  <span>1-800-SPEED-UP</span>
                </div>
              </div>
              
              <a href="[SUPPORT_URL]" style="display: inline-block; padding: 14px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', sans-serif; margin-bottom: 20px;">Contact Support Team</a>
              
              <div style="font-size: 14px; color: #666; margin-top: 20px;">
                <p>Ecom Speed Expert © 2025 | App Developed By BOOST STAR Experts</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
  