#import "SharedStorage.h"

@implementation SharedStorage

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(set:(NSString *)key
                  :(NSString *)value)
{
  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:@"group.com.ggg02.resetnativelocale.shared"];
  [sharedDefaults setObject:value forKey:key];
  [sharedDefaults synchronize];
}

@end
