// utils/emailTemplates.ts
export function weeklyEmailTemplate({shopName,currentDateUTC,afterOneWeekUTC}: {
    shopName : string;
    currentDateUTC : Date;
    afterOneWeekUTC : Date
  }) {
return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Ecom Speed Expert - Performance Report</title>
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <!--<![endif]-->
  <style type="text/css">
    /* Basic styles for email clients that support CSS */
    @media screen and (max-width: 600px) {
      .full-width {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .stack {
        display: block !important;
        width: 100% !important;
      }
      
      .center {
        text-align: center !important;
      }
      
      .mobile-padding {
        padding: 0 15px !important;
      }
      
      .mobile-hide {
        display: none !important;
      }
      
      .mobile-center {
        text-align: center !important;
      }
      
      .mobile-block {
        display: block !important;
      }
      
      .logo-x {
        font-size: 20px !important;
        margin: 0 10px !important;
      }
      
      .logo {
        height: 40px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #000; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="700" border="0" cellspacing="0" cellpadding="0" style="max-width: 700px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #97ba52; color: white; padding: 30px; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 0 10px;">
                          <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Ecom_Speed_Expert_1.png?v=1761657122" alt="Ecom Speed Expert Logo" width="60" style="height: 60px; border-radius: 8px;">
                        </td>
                        <td align="center" style="padding: 0 10px; font-size: 28px; font-weight: 700; font-family: 'Poppins', Arial, sans-serif;">
                          ×
                        </td>
                        <td align="center" style="padding: 0 10px;">
                          <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Shopify_logo_1.png?v=1761659987" alt="Shopify Logo" width="60" style="height: 60px; border-radius: 8px;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <div style="background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 15px; font-size: 14px; font-weight: 600; display: inline-block;">App Developed By Official Shopify Partners</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <h1 style="font-family: 'Poppins', Arial, sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 10px;">Speed Optimization Report</h1>
                    <p style="font-size: 16px; opacity: 0.9;">Your Weekly Update</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Report Info -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f5f5f5; border-bottom: 1px solid #e9ecef;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33%" style="padding-right: 10px;" valign="top" class="stack">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Store</td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; font-weight: 600; color: #000;">${shopName}</td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" style="padding-right: 10px;" valign="top" class="stack">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Period</td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; font-weight: 600; color: #000;">${currentDateUTC} - ${afterOneWeekUTC}</td>
                      </tr>
                    </table>
                  </td>
                  <td width="33%" valign="top" class="stack">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Status</td>
                      </tr>
                      <tr>
                        <td>
                          <div style="display: inline-block; background-color: #97ba52; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                            ✓ Active
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <!-- Optimization Section -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h2 style="font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px;">🚀 Speed Expert is Optimizing These Areas</h2>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f5f5f5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 15px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 12px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 14px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Faster Page Load</h4>
                                      <p style="font-size: 14px; color: #666; margin: 0;">Enhances navigation speed by prefetching likely next pages before users click.</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f5f5f5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 15px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 12px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 14px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Font Optimization</h4>
                                      <p style="font-size: 14px; color: #666; margin: 0;">Optimizes font loading to prevent text flashes and improve perceived performance.</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f5f5f5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 15px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 12px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 14px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Image Lazy Loading</h4>
                                      <p style="font-size: 14px; color: #666; margin: 0;">Delays loading of images until they're needed, reducing initial page load time.</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f5f5f5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 15px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 12px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 14px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">JavaScript Lazy Loading</h4>
                                      <p style="font-size: 14px; color: #666; margin: 0;">Optimizes JavaScript execution to prevent blocking page rendering.</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f5f5f5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 15px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 12px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 14px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Preloading & Prefetching</h4>
                                      <p style="font-size: 14px; color: #666; margin: 0;">Intelligently loads resources before they're needed to reduce wait times.</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Plan Section -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 35px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 12px;">
                      <tr>
                        <td style="padding: 25px;">
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-bottom: 20px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #000;">You're on the Free Plan</td>
                                    <td align="right">
                                      <div style="background-color: #ffc107; color: #856404; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block;">Limited</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 25px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="font-size: 14px; font-weight: 600; padding-bottom: 8px;">
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td>App Potential Usage</td>
                                          <td align="right">25%</td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td style="height: 10px; background-color: #e9ecef; border-radius: 5px; overflow: hidden; position: relative;">
                                            <div style="height: 100%; width: 25%; background-color: #97ba52; border-radius: 5px;"></div>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 25px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td width="50%" style="padding-right: 10px; padding-bottom: 10px;" valign="top" class="stack">
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td valign="top" width="20" style="padding-right: 10px;">
                                            <table role="presentation" width="20" height="20" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 50%;">
                                              <tr>
                                                <td align="center" style="color: white; font-size: 12px;">✓</td>
                                              </tr>
                                            </table>
                                          </td>
                                          <td valign="top">
                                            <p style="font-size: 14px; margin: 0;">Home page optimization</p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td width="50%" style="padding-left: 10px; padding-bottom: 10px;" valign="top" class="stack">
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td valign="top" width="20" style="padding-right: 10px;">
                                            <table role="presentation" width="20" height="20" border="0" cellspacing="0" cellpadding="0" style="background-color: #e9ecef; border-radius: 50%;">
                                              <tr>
                                                <td align="center" style="color: #999; font-size: 12px;">✓</td>
                                              </tr>
                                            </table>
                                          </td>
                                          <td valign="top">
                                            <p style="font-size: 14px; margin: 0; color: #999;">Product page optimization</p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td width="50%" style="padding-right: 10px; padding-bottom: 10px;" valign="top" class="stack">
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td valign="top" width="20" style="padding-right: 10px;">
                                            <table role="presentation" width="20" height="20" border="0" cellspacing="0" cellpadding="0" style="background-color: #e9ecef; border-radius: 50%;">
                                              <tr>
                                                <td align="center" style="color: #999; font-size: 12px;">✓</td>
                                              </tr>
                                            </table>
                                          </td>
                                          <td valign="top">
                                            <p style="font-size: 14px; margin: 0; color: #999;">Collection page optimization</p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td width="50%" style="padding-left: 10px; padding-bottom: 10px;" valign="top" class="stack">
                                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td valign="top" width="20" style="padding-right: 10px;">
                                            <table role="presentation" width="20" height="20" border="0" cellspacing="0" cellpadding="0" style="background-color: #e9ecef; border-radius: 50%;">
                                              <tr>
                                                <td align="center" style="color: #999; font-size: 12px;">✓</td>
                                              </tr>
                                            </table>
                                          </td>
                                          <td valign="top">
                                            <p style="font-size: 14px; margin: 0; color: #999;">Cart page optimization</p>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td align="center">
                                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td style="background-color: #97ba52; border-radius: 8px; text-align: center;">
                                      <a href="#" style="display: block; padding: 14px 24px; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', Arial, sans-serif;">Unlock Full Potential</a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Motivation Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 35px;">
                <tr>
                  <td>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #97ba52; border-radius: 10px;">
                      <tr>
                        <td style="padding: 25px; color: white;">
                          <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600; margin-bottom: 15px;">Why Speed Optimization Matters for Your Store</h3>
                          <p style="font-size: 15px; margin-bottom: 15px; opacity: 0.95;">Every millisecond counts in e-commerce. Amazon found that every 100ms of latency reduces sales by 1%.</p>
                          
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-bottom: 10px;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 10px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 16px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <p style="font-size: 15px; margin: 0; font-weight: 500;">Improved user experience leads to higher conversion rates</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td valign="top" width="24" style="padding-right: 10px;">
                                      <table role="presentation" width="24" height="24" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                          <td align="center" style="color: white; font-size: 16px;">✓</td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td valign="top">
                                      <p style="font-size: 15px; margin: 0; font-weight: 500;">Faster sites rank better in search results</p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Separator -->
          <tr>
            <td style="height: 1px; background-color: #e9ecef; margin: 30px 0;"></td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">⭐ Your Review Motivates Our Team</h3>
              <p style="margin-bottom: 20px; color: #666;">Your feedback helps us improve and create better features for your store. A 5-star review would greatly motivate our team to continue delivering exceptional performance optimization.</p>
              
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td style="background-color: #000; border-radius: 8px; text-align: center;">
                    <a href="#" style="display: block; padding: 14px 24px; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: 'Poppins', Arial, sans-serif;">Leave a Review</a>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>Ecom Speed Expert</p>
              </div>
            </td>
          </tr>
          
          <!-- Report Footer -->
                 </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
  